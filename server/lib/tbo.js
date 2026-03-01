/**
 * tbo.js — TBO (Tektravels) UAT Flight API wrapper.
 * Replaces amadeus.js for all flight operations.
 *
 * API Base: https://api.tektravels.com/BookingEngineService_Air/GuestRestService.svc/rest/
 * Credentials: UserName=Hackathon / Password=Hackathon@1234
 */

const TBO_AUTH_URL = 'http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate';
const TBO_BASE = 'http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest';
const TBO_CREDS = {
    UserName: 'Hackathon',
    Password: 'Hackathon@1234',
    ClientId: 'ApiIntegrationNew',
    EndUserIp: '192.168.10.10',
};

// ── Token cache ───────────────────────────────────────────────────────────────
let _tokenId = null;
let _tokenExpiry = 0;

async function getToken() {
    if (_tokenId && Date.now() < _tokenExpiry) return _tokenId;
    const res = await fetch(TBO_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ClientId: TBO_CREDS.ClientId,
            UserName: TBO_CREDS.UserName,
            Password: TBO_CREDS.Password,
            EndUserIp: TBO_CREDS.EndUserIp,
        }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`TBO Auth returned non-JSON: ${text.slice(0, 200)}`); }
    if (data.Status !== 1 || !data.TokenId) {
        throw new Error(`TBO Auth failed (Status=${data.Status}): ${data.Error?.ErrorMessage || text.slice(0, 100)}`);
    }
    _tokenId = data.TokenId;
    _tokenExpiry = Date.now() + 20 * 60 * 60 * 1000; // valid until end of day
    return _tokenId;
}

async function tboPost(endpoint, payload) {
    const TokenId = await getToken();
    const res = await fetch(`${TBO_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, TokenId, EndUserIp: TBO_CREDS.EndUserIp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`TBO ${endpoint} error: ${res.status}`);
    return data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeTraceId() {
    return `tbo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseDuration(minutes) {
    return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Normalize a TBO Result object into the standard flight shape used by the frontend. */
function normalizeResult(r, traceId) {
    const seg = r.Segments?.[0]?.[0] || {};
    const fare = r.Fare || {};
    const deptTime = seg.DepartureTime || '';
    const arrTime = seg.ArrivalTime || '';

    // Calculate duration in minutes
    let durationMins = 0;
    if (deptTime && arrTime) {
        const dept = new Date(deptTime);
        const arr = new Date(arrTime);
        durationMins = Math.round((arr - dept) / 60000);
    }

    const segments = r.Segments?.[0] || [];
    const stops = Math.max(0, segments.length - 1);
    const airlines = [...new Set(segments.map(s => s.Airline?.AirlineName || s.Airline?.AirlineCode).filter(Boolean))];

    return {
        id: r.ResultIndex || `${traceId}-${Math.random().toString(36).slice(2)}`,
        resultIndex: r.ResultIndex,
        traceId,
        flyFrom: seg.Origin?.Airport?.AirportCode || '',
        flyTo: segments[segments.length - 1]?.Destination?.Airport?.AirportCode || '',
        flyFromCity: seg.Origin?.Airport?.CityName || seg.Origin?.Airport?.AirportCode || '',
        flyToCity: segments[segments.length - 1]?.Destination?.Airport?.CityName || '',
        airlines,
        airlineCode: seg.Airline?.AirlineCode || '',
        flightNumber: `${seg.Airline?.AirlineCode || ''}${seg.FlightNumber || ''}`,
        departure: deptTime,
        arrival: segments[segments.length - 1]?.ArrivalTime || arrTime,
        duration: parseDuration(durationMins),
        stops,
        price: Math.round(fare.PublishedFare || fare.BaseFare || 0),
        baseFare: Math.round(fare.BaseFare || 0),
        tax: Math.round((fare.PublishedFare || 0) - (fare.BaseFare || 0)),
        currency: 'INR',
        cabinClass: seg.CabinClass || '',
        availability: r.IsRefundable !== undefined ? (r.IsRefundable ? 'Refundable' : 'Non-refundable') : '',
        baggage: seg.Baggage || '',
        isLCC: r.IsLCC || false,
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search flights via TBO.
 * Returns normalized flight array + traceId for chaining.
 */
export async function tboSearchFlights({ origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' }) {
    const traceId = makeTraceId();

    const cabinMap = {
        ECONOMY: 1, PREMIUM_ECONOMY: 2, BUSINESS: 3, FIRST: 4,
    };

    const JourneyType = returnDate ? 2 : 1; // 1=OneWay 2=Return

    const Segments = [
        {
            Origin: origin,
            Destination: destination,
            FlightCabinClass: cabinMap[travelClass] || 1,
            PreferredDepartureTime: departureDate,
            PreferredArrivalTime: departureDate,
        },
    ];

    if (returnDate) {
        Segments.push({
            Origin: destination,
            Destination: origin,
            FlightCabinClass: cabinMap[travelClass] || 1,
            PreferredDepartureTime: returnDate,
            PreferredArrivalTime: returnDate,
        });
    }

    const payload = {
        AdultCount: String(adults),
        ChildCount: '0',
        InfantCount: '0',
        DirectFlight: 'false',
        OneStopFlight: 'false',
        JourneyType: String(JourneyType),
        PreferredAirlines: null,
        Segments,
        Sources: null,
    };

    const data = await tboPost('Search', { EndUserIp: TBO_CREDS.EndUserIp, TraceId: traceId, ...payload });

    const results = data.Response?.Results?.flat?.() || [];
    const flights = results.map(r => normalizeResult(r, traceId));

    return { flights, traceId };
}

/**
 * Re-validate / re-price a selected flight before booking.
 */
export async function tboRepriceFlight({ traceId, resultIndex }) {
    const data = await tboPost('FareRevalidate', { TraceId: traceId, ResultIndex: resultIndex });
    return data.Response;
}

/**
 * Book a flight. Returns PNR details.
 * passenger: { Title, FirstName, LastName, PaxType=1, DateOfBirth, PassportNo, PassportExpiry, Nationality }
 */
export async function tboBookFlight({ traceId, resultIndex, passengers, deliveryInfo }) {
    const Passengers = passengers.map((p, i) => ({
        Title: p.Title || 'Mr',
        FirstName: p.FirstName,
        LastName: p.LastName,
        PaxType: p.PaxType || 1,
        DateOfBirth: p.DateOfBirth || '1990-01-01',
        Gender: p.Gender || 1,
        PassportNo: p.PassportNo || '',
        PassportExpiry: p.PassportExpiry || '',
        PassportOrigin: p.Nationality || 'IN',
        Nationality: p.Nationality || 'IN',
        ContactNo: p.ContactNo || '9999999999',
        Email: p.Email || 'guest@tbo.com',
        IsLeadPax: i === 0,
        Fare: null,
        Baggage: null,
        MealDynamic: null,
        SeatDynamic: null,
    }));

    const data = await tboPost('Book', {
        TraceId: traceId,
        ResultIndex: resultIndex,
        Passengers,
        ...(deliveryInfo || {}),
    });

    if (data.Response?.Error?.ErrorCode !== 0) {
        throw new Error(data.Response?.Error?.ErrorMessage || 'TBO booking failed');
    }

    return {
        pnr: data.Response?.PNRDetails?.[0]?.PNR || data.Response?.BookingId,
        bookingId: data.Response?.BookingId,
        status: data.Response?.BookingStatus || 'CONFIRMED',
        raw: data.Response,
    };
}

/**
 * Cancel a booking by TBO BookingId.
 */
export async function tboCancelFlight({ bookingId, requestType = 4 }) {
    const data = await tboPost('Cancel', { BookingId: bookingId, RequestType: requestType, Remarks: 'Guest cancelled' });
    return data.Response;
}

/**
 * Airport autocomplete — using a curated set of major Indian airports
 * complemented by TBO's city/airport search if available.
 */
export async function tboAirportSearch(query) {
    if (!query || query.length < 2) return [];

    // Common Indian + international airports for fast lookup
    const AIRPORTS = [
        { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', country: 'India' },
        { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India' },
        { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India' },
        { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'India' },
        { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India' },
        { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', country: 'India' },
        { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India' },
        { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', country: 'India' },
        { code: 'PNQ', city: 'Pune', name: 'Pune Airport', country: 'India' },
        { code: 'GOI', city: 'Goa', name: 'Goa International Airport', country: 'India' },
        { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'India' },
        { code: 'UDR', city: 'Udaipur', name: 'Maharana Pratap Airport', country: 'India' },
        { code: 'JDH', city: 'Jodhpur', name: 'Jodhpur Airport', country: 'India' },
        { code: 'JLR', city: 'Jabalpur', name: 'Dumna Airport', country: 'India' },
        { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh Airport', country: 'India' },
        { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', country: 'India' },
        { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International Airport', country: 'India' },
        { code: 'PAT', city: 'Patna', name: 'Patna Airport', country: 'India' },
        { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International Airport', country: 'India' },
        { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar International Airport', country: 'India' },
        { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul Alam Airport', country: 'India' },
        { code: 'IXD', city: 'Allahabad', name: 'Bamrauli Airport', country: 'India' },
        { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International Airport', country: 'India' },
        { code: 'TRV', city: 'Thiruvananthapuram', name: 'Thiruvananthapuram International Airport', country: 'India' },
        { code: 'IXM', city: 'Madurai', name: 'Madurai Airport', country: 'India' },
        { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore International Airport', country: 'India' },
        { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International Airport', country: 'India' },
        { code: 'BHO', city: 'Bhopal', name: 'Raja Bhoj Airport', country: 'India' },
        { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda Airport', country: 'India' },
        { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International Airport', country: 'India' },
        // International
        { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE' },
        { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
        { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
        { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'UK' },
        { code: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport', country: 'USA' },
        { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
        { code: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'Japan' },
        { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia' },
        { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'Malaysia' },
        { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International Airport', country: 'Hong Kong' },
    ];

    const q = query.toLowerCase();
    return AIRPORTS.filter(a =>
        a.code.toLowerCase().startsWith(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    ).slice(0, 8).map(a => ({
        code: a.code,
        city: a.city,
        name: a.name,
        country: a.country,
        label: `${a.city} (${a.code})`,
        sublabel: `${a.name} · ${a.country}`,
    }));
}

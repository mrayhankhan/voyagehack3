import { useStore } from '../store';

/**
 * useEvent — provides single-event or all-event access with mutation helpers.
 * @param {string|null} eventId - optional event ID for single-event mode
 */
export const useEvent = (eventId = null) => {
    const { events, addEvent, updateEvent, addRSVP } = useStore();
    const event = eventId ? events.find((e) => e.id === eventId) : null;
    return { event, events, addEvent, updateEvent, addRSVP };
};

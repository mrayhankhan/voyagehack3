import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null, // null | { name: 'Agent', email: '...', role: 'AGENT' | 'PLANNER' | 'SUPPLIER' }
  events: [], // Array of created events
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
  addEvent: (event) => set((state) => ({ events: [...state.events, { id: Date.now().toString(), confirmedGuests: 0, rsvps: [], ...event }] })),
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map(ev => ev.id === id ? { ...ev, ...updates } : ev)
  })),
  addRSVP: (eventId, rsvp) => set((state) => ({
    events: state.events.map(ev => {
      if (ev.id === eventId) {
        const isAttending = rsvp.willAttend === 'yes';
        return {
          ...ev,
          confirmedGuests: isAttending ? ev.confirmedGuests + 1 : ev.confirmedGuests,
          rsvps: [...(ev.rsvps || []), rsvp]
        };
      }
      return ev;
    })
  }))
}));

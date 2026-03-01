import { calculateRemainingInventory, calculateRoomBlocksNeeded } from '../services/inventory.service';
import { useEvent } from './useEvent';

/**
 * useInventory — surface inventory metrics for a given event.
 * @param {string} eventId
 */
export const useInventory = (eventId) => {
    const { event } = useEvent(eventId);
    if (!event) return { event: null, remaining: 0, roomBlocksNeeded: 0 };
    return {
        event,
        remaining: calculateRemainingInventory(event),
        roomBlocksNeeded: calculateRoomBlocksNeeded(event.headcount),
    };
};

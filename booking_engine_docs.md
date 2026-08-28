# Feni Hotel Booking Engine - Understanding Reservations and Check-ins

This guide explains how the Feni Hotel booking engine manages rooms, reservations, and check-ins. It is designed to help you, the staff, and management understand the lifecycle of a booking so you can accurately assist your guests.

## The Core Concept: Booking Status vs. Room Status

The most important concept to understand is that **Bookings** and **Rooms** are tracked separately, and each has its own lifecycle. 

### 1. Room Status (Physical State)
This represents the *physical state of the room right now*. 
- **AVAILABLE**: The room is empty, clean, and ready for a guest to walk in today.
- **OCCUPIED**: A guest is currently sleeping in this room.
- **DIRTY**: A guest has checked out, and housekeeping needs to clean it before it becomes `AVAILABLE` again.

### 2. Booking Status (Guest Stay)
This represents a *guest's itinerary*.
- **RESERVED**: A guest is scheduled to arrive on a future date. They have not yet checked in.
- **CHECKED_IN**: The guest has arrived, paid, and is currently occupying a room.
- **CHECKED_OUT**: The guest has left and the booking is finalized.

---

## How Advance Reservations Work

When you create an **Advance Reservation** for a guest for a future date (e.g., next week), here is what happens in the system:

1. **The Booking is Created**: A new Booking is generated with the status `RESERVED`. 
2. **The Room Status DOES NOT Change Today**: If you reserved Room 101 for next week, Room 101's physical status remains `AVAILABLE` today. You can still check a different guest into Room 101 this weekend!
3. **Double-Booking Prevention (The Overlap Check)**: Even though Room 101 is physically `AVAILABLE` today, the booking engine's "Overlap Checker" actively guards the calendar. If another receptionist attempts to create a walk-in or a reservation for Room 101 on the same dates next week, the system will block it and show an error. 

> [!TIP]
> This separation allows maximum occupancy. You don't have to "lock" a room and leave it empty today just because someone is arriving next week.

---

## The Check-in Process

### 1. Walk-in Check-in
When a guest arrives without a prior reservation, you use the **Walk-in Check-in** flow.
- The system checks if the room is physically `AVAILABLE` today.
- The system runs the Overlap Checker to ensure no one has reserved that room for the guest's intended dates.
- Payment is collected immediately.
- The Booking is instantly marked `CHECKED_IN`, and the Room becomes physically `OCCUPIED`. 
- The accounting ledger records the transaction.

### 2. Checking in an Advance Reservation
When a guest with a `RESERVED` booking arrives on their scheduled date:
- You click **Check In** on their existing reservation on the dashboard.
- The system verifies the room is physically `AVAILABLE` right now (meaning the previous guest has checked out and the room is clean).
- You collect payment and any missing DSS (Department of State Services) details.
- The Booking status transitions from `RESERVED` to `CHECKED_IN`.
- The Room becomes physically `OCCUPIED`.
- The accounting ledger records the transaction.

> [!WARNING]
> If the guest's reserved room is still `OCCUPIED` by a previous guest who overstayed, the Check-in will be blocked. You will need to use the **Change Room** feature to move the arriving guest to an available room.

---

## Frequently Asked Questions

**Why isn't payment collected when making an Advance Reservation?**
To keep accounting simple and accurate, the system collects the total payment at the time of Check-in. This avoids complex deposit tracking and refunds if the guest cancels before arrival. 

**What happens if I try to extend a guest's stay, but someone else has reserved the room?**
The Overlap Checker protects extensions as well! If Guest A wants to stay two extra days, but Guest B has already reserved that room for tomorrow, the system will block the extension. You must change Guest A's room or reassign Guest B's reservation.

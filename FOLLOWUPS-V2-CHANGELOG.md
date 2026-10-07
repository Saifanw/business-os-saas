# Follow-ups V2

- Centralized local-date follow-up calculations for Today / Overdue / Upcoming.
- Excludes terminal Won/Lost/Paid and completed follow-ups from active follow-up counts.
- Reports and workspace now use the same local-date semantics.
- Saving a Follow-up activity now schedules the selected date/time in `next`.
- Edit Customer now actually updates the existing Firestore contact instead of creating a duplicate.
- Existing Firebase collections and document structure preserved.

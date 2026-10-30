export type BookingFormValues = {
  message: string;
  modalityId: string;
  schoolLevelId: string;
  startDate: string;
  hoursPerWeek: string;
};

// Mirrors the backend rules (StoreBookingRequestRequest) so the parent sees French errors before sending.
export function validateBookingForm(v: BookingFormValues, today: string): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!v.modalityId) errors.modality_id = ["Choisissez une modalité."];
  if (!v.schoolLevelId) errors.school_level_id = ["Choisissez le niveau scolaire."];
  if (!v.startDate) errors.start_date = ["Indiquez une date de début."];
  else if (v.startDate < today) errors.start_date = ["La date de début ne peut pas être passée."];
  const hours = Number(v.hoursPerWeek);
  if (!Number.isInteger(hours) || hours < 1 || hours > 40)
    errors.hours_per_week = ["Indiquez un nombre d'heures entre 1 et 40."];
  const len = v.message.trim().length;
  if (len < 20) errors.message = ["Décrivez votre besoin en 20 caractères au moins."];
  else if (len > 1000) errors.message = ["Votre message ne doit pas dépasser 1000 caractères."];
  return errors;
}

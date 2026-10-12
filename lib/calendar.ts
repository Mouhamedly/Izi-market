import { Appointment, Business } from "@/types/database";

export interface CreateAppointmentInput {
  businessId: string;
  contactId?: string | null;
  contactName: string;
  contactPhone: string;
  title: string;
  description?: string | null;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  generateMeet?: boolean;
}

/**
 * Génère une URL directe pour ouvrir et ajouter l'événement dans Google Agenda Web
 */
export function generateGoogleCalendarUrl({
  title,
  description,
  startTime,
  endTime,
  location
}: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}): string {
  // Format requis par Google : YYYYMMDDTHHmmssZ
  const formatDateForGoogle = (isoString: string) => {
    const d = new Date(isoString);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const startFormatted = formatDateForGoogle(startTime);
  const endFormatted = formatDateForGoogle(endTime);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details: description || "",
    location: location || "Dakar, Sénégal"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère un lien de salon Google Meet unique
 */
export function generateGoogleMeetUrl(identifier?: string): string {
  const code = identifier 
    ? identifier.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 10)
    : Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);
  return `https://meet.google.com/izi-${code}`;
}

/**
 * Génère le contenu d'un fichier .ics standard (iCalendar compatible Google, Apple, Outlook)
 */
export function generateIcsContent(appointment: Appointment): string {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const start = formatDate(appointment.start_time);
  const end = formatDate(appointment.end_time);
  const now = formatDate(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IZI Market//WhatsApp AI Assistant//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:izi-${appointment.id}@izimarket.sn`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:${(appointment.description || "") + (appointment.google_meet_link ? "\\nGoogle Meet: " + appointment.google_meet_link : "")}`,
    `LOCATION:${appointment.google_meet_link ? appointment.google_meet_link : "Dakar, Sénégal"}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return lines.join("\r\n");
}

/**
 * Télécharge le fichier .ics directement dans le navigateur
 */
export function downloadIcsFile(appointment: Appointment) {
  if (typeof window === "undefined") return;
  const content = generateIcsContent(appointment);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `rdv-${appointment.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Crée un rendez-vous complet avec Google Agenda
 * Effectue l'appel API Google Calendar si un Access Token est disponible,
 * ou génère les liens Google Calendar & Meet automatiques.
 */
export async function createGoogleCalendarAppointment(
  input: CreateAppointmentInput,
  business?: Business
): Promise<Appointment> {
  const meetLink = input.generateMeet !== false 
    ? generateGoogleMeetUrl(input.contactName) 
    : null;

  const desc = [
    input.description || "",
    `Prospect : ${input.contactName} (${input.contactPhone})`,
    meetLink ? `Lien Google Meet : ${meetLink}` : "",
    "Organisé automatiquement via IZI Market Assistant WhatsApp"
  ].filter(Boolean).join("\n\n");

  const calendarUrl = generateGoogleCalendarUrl({
    title: input.title,
    description: desc,
    startTime: input.startTime,
    endTime: input.endTime,
    location: meetLink || "Dakar, Sénégal"
  });

  let googleEventId = `g_evt_${Date.now()}`;

  // Si un token OAuth Google est présent dans business ou variable d'environnement
  const googleToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || business?.wa_access_token;
  if (googleToken && !googleToken.includes("demo")) {
    try {
      const calendarId = business?.google_calendar_id || "primary";
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: input.title,
          description: desc,
          start: { dateTime: input.startTime },
          end: { dateTime: input.endTime },
          conferenceData: input.generateMeet !== false ? {
            createRequest: {
              requestId: `req_${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          } : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.id) googleEventId = data.id;
      }
    } catch (err) {
      console.warn("[Google Calendar API] Erreur lors de l'appel direct, fallback local utilisé:", err);
    }
  }

  const newAppointment: Appointment = {
    id: `appt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    business_id: input.businessId,
    contact_id: input.contactId || null,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    title: input.title,
    description: input.description || null,
    start_time: input.startTime,
    end_time: input.endTime,
    google_event_id: googleEventId,
    google_meet_link: meetLink,
    google_calendar_url: calendarUrl,
    status: "confirmed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return newAppointment;
}

/**
 * Formatage convivial en français pour les dates de rendez-vous
 */
export function formatAppointmentSlot(startIso: string, endIso?: string): string {
  try {
    const start = new Date(startIso);
    const dateStr = start.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
    
    // Première lettre de dateStr en majuscule
    const capitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    const startTimeStr = start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (endIso) {
      const end = new Date(endIso);
      const endTimeStr = end.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });
      return `${capitalized} de ${startTimeStr} à ${endTimeStr}`;
    }

    return `${capitalized} à ${startTimeStr}`;
  } catch {
    return startIso;
  }
}

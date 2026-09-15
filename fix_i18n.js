const fs = require('fs');
const path = require('path');

const updateI18n = (file, newTitle, newAppointments) => {
    let content = JSON.parse(fs.readFileSync(file, 'utf8'));
    content.dashboardScreen.today.title = newTitle;
    Object.assign(content.dashboardScreen.appointments, newAppointments);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
};

const trPath = path.join('src', 'core', 'i18n', 'locales', 'tr.json');
updateI18n(trPath, "Randevu / Rezervasyon", {
    reservationWith: "{{name}} - Rezervasyon",
    appointmentWith: "{{name}} - Randevu",
    weeklyTeamReview: "Haftalýk Ekip Deðerlendirmesi"
});

const enPath = path.join('src', 'core', 'i18n', 'locales', 'en.json');
updateI18n(enPath, "Appointments / Reservations", {
    reservationWith: "{{name}} - Reservation",
    appointmentWith: "{{name}} - Appointment",
    weeklyTeamReview: "Weekly Team Review"
});

const dePath = path.join('src', 'core', 'i18n', 'locales', 'de.json');
updateI18n(dePath, "Termine / Reservierungen", {
    reservationWith: "{{name}} - Reservierung",
    appointmentWith: "{{name}} - Termin",
    weeklyTeamReview: "Wöchentliche Team-Bewertung"
});

console.log("Translations updated");

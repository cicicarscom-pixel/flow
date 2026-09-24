const fs = require("fs"); let c = fs.readFileSync("src/modules/randevu/presentation/hooks/useAppointments.ts", "utf8"); 
c = c.replace(/const addAppointment = async \(appointment: Omit<Appointment, \x27id\x27 | \x27createdAt\x27 | \x27updatedAt\x27>\) => \{/g, "const addAppointment = async (appointment: Omit<Appointment, \x27id\x27 | \x27createdAt\x27 | \x27updatedAt\x27>) => {");
fs.writeFileSync("src/modules/randevu/presentation/hooks/useAppointments.ts", c, "utf8"); console.log("OK");

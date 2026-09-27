const fs = require('fs');
let content = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

if (!content.includes('import { useNavigation, useRoute }')) {
  content = content.replace("import { useNavigation } from '@react-navigation/native';", "import { useNavigation, useRoute } from '@react-navigation/native';");
}

content = content.replace(
  `  const navigation = useNavigation();\r
  const insets = useSafeAreaInsets();`,
  `  const navigation = useNavigation();\r
  const route = useRoute();\r
  const insets = useSafeAreaInsets();`
);

content = content.replace(
  `  const navigation = useNavigation();\n  const insets = useSafeAreaInsets();`,
  `  const navigation = useNavigation();\n  const route = useRoute();\n  const insets = useSafeAreaInsets();`
);

content = content.replace(
  `  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(todayStr, activeCalendarId);`,
  `  const { appointments, loading, isSlotBusy, selectedDate, setSelectedDate, addAppointment } = useAppointments(route.params?.date || todayStr, activeCalendarId);`
);

// We need to also sync when route.params?.date changes
content = content.replace(
  `  React.useEffect(() => {\r
    if (selectedDate) {\r
      const [year, month] = selectedDate.split('-');\r
      const newD = new Date(parseInt(year), parseInt(month) - 1, 1);\r
      if (newD.getMonth() !== currentDate.getMonth() || newD.getFullYear() !== currentDate.getFullYear()) {\r
        setCurrentDate(newD);\r
      }\r
    }\r
  }, [selectedDate]);`,
  `  React.useEffect(() => {\n    if (route.params?.date) {\n      setSelectedDate(route.params.date);\n    }\n  }, [route.params?.date]);\n\n  React.useEffect(() => {\r\n    if (selectedDate) {\r\n      const [year, month] = selectedDate.split('-');\r\n      const newD = new Date(parseInt(year), parseInt(month) - 1, 1);\r\n      if (newD.getMonth() !== currentDate.getMonth() || newD.getFullYear() !== currentDate.getFullYear()) {\r\n        setCurrentDate(newD);\r\n      }\r\n    }\r\n  }, [selectedDate]);`
);
content = content.replace(
  `  React.useEffect(() => {\n    if (selectedDate) {\n      const [year, month] = selectedDate.split('-');\n      const newD = new Date(parseInt(year), parseInt(month) - 1, 1);\n      if (newD.getMonth() !== currentDate.getMonth() || newD.getFullYear() !== currentDate.getFullYear()) {\n        setCurrentDate(newD);\n      }\n    }\n  }, [selectedDate]);`,
  `  React.useEffect(() => {\n    if (route.params?.date) {\n      setSelectedDate(route.params.date);\n    }\n  }, [route.params?.date]);\n\n  React.useEffect(() => {\n    if (selectedDate) {\n      const [year, month] = selectedDate.split('-');\n      const newD = new Date(parseInt(year), parseInt(month) - 1, 1);\n      if (newD.getMonth() !== currentDate.getMonth() || newD.getFullYear() !== currentDate.getFullYear()) {\n        setCurrentDate(newD);\n      }\n    }\n  }, [selectedDate]);`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', content, 'utf8');

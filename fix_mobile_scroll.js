const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

if (!c.includes('calendarScrollRef')) {
  c = c.replace(
    /const dynamicDays = useMemo/,
    `const calendarScrollRef = useRef(null);

  React.useEffect(() => {
    const index = dynamicDays.findIndex(d => d.fullDate === selectedDate);
    if (index !== -1 && calendarScrollRef.current) {
      calendarScrollRef.current.scrollTo({ x: index * 60 - 150, animated: true });
    }
  }, [selectedDate, dynamicDays]);

  const dynamicDays = useMemo`
  );

  c = c.replace(
    `<ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
            style={styles.calendarScroll}
          >`,
    `<ScrollView
            ref={calendarScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarStrip}
            style={styles.calendarScroll}
          >`
  );

  fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
}

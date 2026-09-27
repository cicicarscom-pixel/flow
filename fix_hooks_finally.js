const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');
let lines = c.split(/\\r?\\n/);
let start = -1;
let end = -1;
for(let i=0; i<lines.length; i++){
  if(lines[i].includes('const [isModalVisible, setIsModalVisible] = useState(false);')){
    start = i;
  }
  if(lines[i].includes('const [promptConfig, setPromptConfig] = useState')){
    end = i;
  }
}
if(start !== -1 && end !== -1){
  let stateLines = lines.splice(start, end - start + 1);
  let target = lines.findIndex(l => l.includes('const { appointments'));
  if(target !== -1) {
    lines.splice(target, 0, ...stateLines);
    fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', lines.join('\\n'), 'utf8');
    console.log('Fixed hooks');
  } else {
    console.log('Could not find target line for useAppointments.');
  }
} else {
  console.log('Could not find start/end.', start, end);
}

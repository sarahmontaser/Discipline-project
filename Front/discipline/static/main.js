// ===== GLOBAL DATA =====
let height = parseFloat(localStorage.getItem("height")) || '';
let weight = parseFloat(localStorage.getItem("weight")) || '';
let weights = JSON.parse(localStorage.getItem("weights")) || [];
let days = JSON.parse(localStorage.getItem("days")) || [];

let waterTotal = parseFloat(localStorage.getItem("waterTotal")) || 0;
let waterGoal = parseFloat(localStorage.getItem("waterGoal")) || 2;
let sleepEntries = JSON.parse(localStorage.getItem("sleepEntries")) || [];
let sleepGoal = parseFloat(localStorage.getItem("sleepGoal")) || 8;

let weightChart, waterCircle, sleepCircle;
let waterReminderInterval;


// ===== INIT =====
document.addEventListener("DOMContentLoaded",()=>{
    loadBodyInputs();
    drawWeightChart();
    updateBMI();
    drawCircles();
});

// ===== BODY =====
function loadBodyInputs(){
    const heightInput = document.getElementById("heightInput");
    const weightInput = document.getElementById("weightInput");
    const viewHeight = document.getElementById("viewHeight");
    const viewWeight = document.getElementById("viewWeight");
    if(heightInput) heightInput.value = height || '';
    if(weightInput) weightInput.value = weight || '';
    if(viewHeight) viewHeight.innerText = height || "--";
    if(viewWeight) viewWeight.innerText = weight || "--";
}

function saveBody(){
    const h = parseFloat(document.getElementById("heightInput").value);
    const w = parseFloat(document.getElementById("weightInput").value);
    if(!h || !w) return alert("Enter valid height & weight!");
    height = h; weight = w;
    localStorage.setItem("height", h);
    localStorage.setItem("weight", w);

    const today = new Date();

    const day = today.getDate();
    const month = today.getMonth() + 1; // عشان الشهور بتبدأ من 0
    const year = today.getFullYear().toString().slice(-2); // آخر رقمين من السنة

    const formattedDate = `${day}/${month}/${year}`;

    days.push(formattedDate);

    weights.push(w);
    
    localStorage.setItem("weights", JSON.stringify(weights));
    localStorage.setItem("days", JSON.stringify(days));

    loadBodyInputs();
    drawWeightChart();
    updateBMI();
}

// ===== WEIGHT CHART =====
function drawWeightChart(){
    const ctx = document.getElementById("weightChart");
    if(weightChart) weightChart.destroy();
    weightChart = new Chart(ctx,{
        type:'line',
        data:{labels:days,datasets:[{label:'Weight (kg)',data:weights,borderColor:'#0077cc',borderWidth:3,tension:0.4,fill:false}]},
        options:{responsive:true,scales:{y:{beginAtZero:false}}}
    });
}

// ===== BMI =====
function updateBMI(){
    if(!height || !weight) return;
    const bmi = (weight/(height/100*height/100)).toFixed(1);
    const indicator = document.getElementById("bmiIndicator");
    const text = document.getElementById("bmiText");
    if(!indicator || !text) return;

    let color='green';
    if(bmi<18.5) color='orange';
    else if(bmi>25) color='red';

    const maxBMI = 40;
    let pos = Math.min((bmi/maxBMI)*100,100);
    indicator.style.left = `calc(${pos}% - 3px)`;
    indicator.style.background = color;
    text.innerText = `BMI: ${bmi}`;
    text.style.color = color;
}

// ===== CIRCLES =====
function drawCircles(){
    // WATER
    const waterPercent = Math.min((waterTotal/waterGoal)*100,100);
    const waterCtx = document.getElementById("waterCircle").getContext("2d");
    if(waterCircle) waterCircle.destroy();
    waterCircle = new Chart(waterCtx,{
        type:'doughnut',
        data:{labels:['Done','Remaining'],datasets:[{data:[waterPercent,100-waterPercent],backgroundColor:['rgba(173,216,230,0.8)','#eee'],borderWidth:0}]},
        options:{cutout:'70%',responsive:true,plugins:{legend:{display:false},tooltip:{enabled:false}}}
    });
    document.getElementById("waterInfo").innerText = `💧 ${waterTotal.toFixed(1)} / ${waterGoal} L`;

    // SLEEP
    const lastSleep = sleepEntries.length ? sleepEntries[sleepEntries.length-1] : 0;
    const sleepPercent = Math.min((lastSleep/sleepGoal)*100,100);
    const sleepCtx = document.getElementById("sleepCircle").getContext("2d");
    if(sleepCircle) sleepCircle.destroy();
    sleepCircle = new Chart(sleepCtx,{
        type:'doughnut',
        data:{labels:['Done','Remaining'],datasets:[{data:[sleepPercent,100-sleepPercent],backgroundColor:['rgba(40,40,100,0.8)','#eee'],borderWidth:0}]},
        options:{cutout:'70%',responsive:true,plugins:{legend:{display:false},tooltip:{enabled:false}}}
    });
    document.getElementById("sleepInfo").innerText = `🌙 ${lastSleep.toFixed(1)} / ${sleepGoal} hrs`;
}

// ===== ADD / RESET =====
function addWater(){ waterTotal+=0.2; localStorage.setItem("waterTotal",waterTotal); drawCircles(); }
function resetWater(){ waterTotal=0; localStorage.setItem("waterTotal",0); drawCircles(); }

function addSleep(hours=1){
    // لو المستخدم ضغط على +1 hr أكتر من مرة، نجمعهم
    let lastSleep = sleepEntries.length ? sleepEntries[sleepEntries.length-1] : 0;
    sleepEntries.push(lastSleep + hours);  // نضيف الساعات على آخر قيمة
    localStorage.setItem("sleepEntries", JSON.stringify(sleepEntries));
    drawCircles();
}

function resetSleep(){ sleepEntries=[]; localStorage.setItem("sleepEntries",JSON.stringify([])); drawCircles(); }

// ===== SET GOALS =====
function setWaterGoal(){ 
    const goal = parseFloat(document.getElementById("waterGoalInput").value);
    if(!goal || goal<=0) return alert("Enter valid water goal!");
    waterGoal=goal; localStorage.setItem("waterGoal",goal); drawCircles();
}
function setSleepGoal(){ 
    const goal = parseFloat(document.getElementById("sleepGoalInput").value);
    if(!goal || goal<=0) return alert("Enter valid sleep goal!");
    sleepGoal=goal; localStorage.setItem("sleepGoal",goal); drawCircles();
}

// ===== WATER REMINDER =====
function startWaterReminder(){
    if(!("Notification" in window)) return alert("Browser does not support notifications");
    Notification.requestPermission();
    const interval = parseInt(document.getElementById("reminderInterval").value);
    if(!interval || interval<1) return alert("Enter valid minutes!");
    stopWaterReminder();
    waterReminderInterval = setInterval(()=>{
        new Notification("💧 Time to drink water!",{body:`Drink a cup to reach ${waterGoal} L`});
    }, interval*60*1000);
    alert("Water reminder started!");
}
function stopWaterReminder(){ if(waterReminderInterval) clearInterval(waterReminderInterval); }
let napReminderInterval;

// ====== START NAP REMINDER ======
function startNapReminder(){
    if(!("Notification" in window)){
        return alert("Your browser does not support notifications");
    }

    Notification.requestPermission();

    const napMinutes = parseFloat(document.getElementById("napInput").value);
    if(!napMinutes || napMinutes <= 0) return alert("Enter valid nap time in minutes!");

    stopNapReminder(); // لو فيه منبه شغال مسبقًا
    napReminderInterval = setTimeout(()=>{
        new Notification("🌙 Time's up!", {
            body: `Your ${napMinutes} minutes nap is finished!`
        });
        alert(`Your ${napMinutes} minutes nap is finished!`);
    }, napMinutes*60*1000);

    alert(`Nap reminder set for ${napMinutes} minutes!`);
}

// ====== STOP NAP REMINDER ======
function stopNapReminder(){
    if(napReminderInterval) clearTimeout(napReminderInterval);
}
//====================================================================workout==

// ==========================
// Helpers for storage
// ==========================
function saveWorkoutData() {
    const container = document.getElementById("workoutContainer");
    const data = [];
  
    container.querySelectorAll(".day-card").forEach(dayCard => {
      const day = {
        name: dayCard.querySelector(".dayNameInput").value,
        exercises: []
      };
  
      dayCard.querySelectorAll(".exercise-card").forEach(exerciseCard => {
        const exercise = {
          name: exerciseCard.querySelector(".exerciseName").value,
          equipment: exerciseCard.querySelector(".equipmentSelect").value,
          sets: parseInt(exerciseCard.querySelector(".setsInput").value) || 0,
          setsData: []
        };
  
        exerciseCard.querySelectorAll(".set-row").forEach(setRow => {
          exercise.setsData.push({
         weight: setRow.querySelector(".small-input-weight")?.value || "",
          reps: setRow.querySelector(".small-input-reps")?.value || "",
          failure: setRow.querySelector(".failure-checkbox")?.checked || false
});
        });
  
        day.exercises.push(exercise);
      });
  
      data.push(day);
    });
  
    localStorage.setItem("workoutData", JSON.stringify(data));
  }
  
  // ==========================
  // Load saved data
  // ==========================
  function loadWorkoutData() {
    const container = document.getElementById("workoutContainer");
    const data = JSON.parse(localStorage.getItem("workoutData") || "[]");
  
    container.innerHTML = "";
  
    data.forEach(day => createDay(day.name, day.exercises));
  }
  
  // ==========================
  // Create a Day
  // ==========================
  function createDay(dayName = "", exercisesData = []) {
    const container = document.getElementById("workoutContainer");
    const dayCard = document.createElement("div");
    dayCard.classList.add("day-card");
  
    dayCard.innerHTML = `
      <h2>
        <img src="../static/arrow.png" class="toggleDay">
        <input type="text" class="dayNameInput" value="${dayName || 'Day'}">
        <button class="deleteDayBtn">Delete</button>
      </h2>
      <button onclick="addExercise(this)">➕ Add Exercise</button>
      <div class="exercise-container"></div>
    `;
  
    container.appendChild(dayCard);
  
    const exercisesContainer = dayCard.querySelector(".exercise-container");
    const toggleDay = dayCard.querySelector(".toggleDay");
    const deleteDayBtn = dayCard.querySelector(".deleteDayBtn");
    const dayNameInput = dayCard.querySelector(".dayNameInput");
  
    // Toggle exercises
    toggleDay.addEventListener("click", function() {
      if(exercisesContainer.style.display === "none") {
        exercisesContainer.style.display = "block";
        this.style.transform = "rotate(180deg)";
      } else {
        exercisesContainer.style.display = "none";
        this.style.transform = "rotate(0deg)";
      }
    });
  
    // Delete day
    
  deleteDayBtn.addEventListener("click", function() {
  dayCard.remove();
  saveWorkoutData();       // تحفظ البيانات بعد الحذف
  populateDayDropdown();   // تحديث dropdown
});
    // Save day name change
    dayNameInput.addEventListener("input", saveWorkoutData);
  
    // Load exercises if provided
    exercisesData.forEach(ex => createExercise(exercisesContainer, ex));
  
    saveWorkoutData();
  }
  
  // ==========================
  // Generate / Add Exercises
  // ==========================
  function addExercise(btn) {
    const exerciseContainer = btn.parentElement.querySelector(".exercise-container");
    createExercise(exerciseContainer, null);
  }
  
  function createExercise(container, exData) {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.classList.add("exercise-card");
  
    exerciseDiv.innerHTML = `
      <h3>
        <img src="../static/arrow.png" class="toggleExercise">
        <span>${exData ? exData.name : "New Exercise"}</span>
        <div>
        <button class="deleteExerciseBtn">Delete</button>
        <div>
      </h3>
      <input type="text" class="exerciseName" placeholder="Exercise name" value="${exData ? exData.name : ""}">
      <select class="equipmentSelect">
        <option value="">Select Equipment</option>
        <option value="Barbell">Barbell</option>
        <option value="Dumbbell">Dumbbell</option>
        <option value="Kettlebell">Kettlebell</option>
        <option value="Cable">Cable</option>
        <option value="Bodyweight">Bodyweight</option>
      </select>
      <input type="number" placeholder="Sets" min="1" class="setsInput" value="${exData ? exData.sets : ""}">
      <button onclick="generateSets(this)">Generate Sets</button>
      <div class="sets-container" style="display:none"></div>
    `;
  
    container.appendChild(exerciseDiv);
  
    const toggleExercise = exerciseDiv.querySelector(".toggleExercise");
    const setsContainer = exerciseDiv.querySelector(".sets-container");
    const deleteExerciseBtn = exerciseDiv.querySelector(".deleteExerciseBtn");
    const exerciseNameInput = exerciseDiv.querySelector(".exerciseName");
    const equipmentSelect = exerciseDiv.querySelector(".equipmentSelect");
    const setsInput = exerciseDiv.querySelector(".setsInput");
  
    // Toggle sets
    toggleExercise.addEventListener("click", function() {
      if(setsContainer.style.display === "none") {
        setsContainer.style.display = "block";
        this.style.transform = "rotate(180deg)";
      } else {
        setsContainer.style.display = "none";
        this.style.transform = "rotate(0deg)";
      }
    });
  
    // Delete exercise
    deleteExerciseBtn.addEventListener("click", function(){
      if(confirm("Are You Sure You Want To Delete This Workout?")) {
        exerciseDiv.remove();
        saveWorkoutData();
      }
    });
  
    // Save changes
    exerciseNameInput.addEventListener("input", saveWorkoutData);
    equipmentSelect.addEventListener("change", saveWorkoutData);
    setsInput.addEventListener("input", saveWorkoutData);
  
    // Load sets if exist
    if(exData && exData.setsData) {
      generateSetsFromData(exerciseDiv, exData.setsData);
    }
  
    saveWorkoutData();
  }
  
  // ==========================
  // Generate Sets
  // ==========================
  function generateSets(btn) {
    const exerciseCard = btn.parentElement;
    const setsNum = parseInt(exerciseCard.querySelector(".setsInput").value);
    if(!setsNum || setsNum < 1) return alert("Enter valid sets");
  
    const setsContainer = exerciseCard.querySelector(".sets-container");
    setsContainer.innerHTML = "";
    setsContainer.style.display = "block";
  
    const toggleExercise = exerciseCard.querySelector(".toggleExercise");
    toggleExercise.style.transform = "rotate(180deg)";
  
  for(let i=1;i<=setsNum;i++){
  const setRow = document.createElement("div");
  setRow.classList.add("set-row");

  setRow.innerHTML = `
  <span>Set ${i} :</span>
  <input type="number" placeholder="Weight" class="small-input-weight">
  <input type="number" placeholder="Reps" class="small-input-reps">
  <label>
    Failure
    <input type="checkbox" class="failure-checkbox">
  </label>
`;
  setsContainer.appendChild(setRow);

  setRow.querySelectorAll("input").forEach(input=>{
    input.addEventListener("input", saveWorkoutData);
    input.addEventListener("change", saveWorkoutData);
  });
}
    saveWorkoutData();
  }
  
  // Load saved sets data
  function generateSetsFromData(exerciseCard, setsData) {
    const setsContainer = exerciseCard.querySelector(".sets-container");
    setsContainer.innerHTML = "";
    setsContainer.style.display = "none"; // مخفية افتراضياً
    const toggleExercise = exerciseCard.querySelector(".toggleExercise");
    toggleExercise.style.transform = "rotate(0deg)";
  
    setsData.forEach((set,i)=>{
      const setRow = document.createElement("div");
      setRow.classList.add("set-row");
      setRow.innerHTML = `
  <span>Set ${i+1}</span>
  <input type="number" placeholder="Weight" 
         class="small-input-weight" value="${set.weight}">
  <input type="number" placeholder="Reps" 
         class="small-input-reps" value="${set.reps}">
  <label>
    Failure
    <input type="checkbox" class="failure-checkbox" 
           ${set.failure ? "checked" : ""}>
  </label>
`;
      setsContainer.appendChild(setRow);
  
      setRow.querySelectorAll("input").forEach(input=>{
        input.addEventListener("input", saveWorkoutData);
        input.addEventListener("change", saveWorkoutData);
      });
    });
  }
  
  // ==========================
  // Generate Days button
  // ==========================
  function generateDays() {
    const num = parseInt(document.getElementById("daysInput").value);
    if(!num || num < 1) return alert("Enter valid number");
  
    const container = document.getElementById("workoutContainer");
    const currentDays = container.querySelectorAll(".day-card").length;
    const startDay = currentDays > 0 ? currentDays + 1 : 1;
  
    for(let i=startDay; i<=num; i++){
      createDay(`Day ${i}`, []);
    }
  
    saveWorkoutData();
  }
 // مكتبة فيديوهات للتمارين
const exerciseVideosLibrary = {
  Chest: [
    {name:"Bench Press", url:"https://www.youtube.com/embed/VIDEO_ID1"},
    {name:"Incline Dumbbell Press", url:"https://www.youtube.com/embed/VIDEO_ID2"},
    {name:"Push Ups", url:"https://www.youtube.com/embed/VIDEO_ID3"},
    {name:"Bench Press", url:"https://www.youtube.com/embed/VIDEO_ID1"},
    {name:"Incline Dumbbell Press", url:"https://www.youtube.com/embed/VIDEO_ID2"},
    {name:"Push Ups", url:"https://www.youtube.com/embed/VIDEO_ID3"}
  ],
  Back: [
    {name:"Pull Ups", url:"https://www.youtube.com/embed/VIDEO_ID4"},
    {name:"Deadlift", url:"https://www.youtube.com/embed/VIDEO_ID5"},
    {name:"Pull Ups", url:"https://www.youtube.com/embed/VIDEO_ID4"},
    {name:"Deadlift", url:"https://www.youtube.com/embed/VIDEO_ID5"},
    {name:"Pull Ups", url:"https://www.youtube.com/embed/VIDEO_ID4"},
    {name:"Deadlift", url:"https://www.youtube.com/embed/VIDEO_ID5"}
  ],
  Legs: [
    {name:"Squats", url:"https://www.youtube.com/embed/VIDEO_ID6"},
    {name:"Lunges", url:"https://www.youtube.com/embed/VIDEO_ID7"},
    {name:"Squats", url:"https://www.youtube.com/embed/VIDEO_ID6"},
    {name:"Lunges", url:"https://www.youtube.com/embed/VIDEO_ID7"},
    {name:"Squats", url:"https://www.youtube.com/embed/VIDEO_ID6"},
    {name:"Lunges", url:"https://www.youtube.com/embed/VIDEO_ID7"}
  ],
  // ضيفي باقي العضلات بنفس الطريقة
};

// عرض فيديوهات العضلة المختارة
function showExerciseVideos() {
  const muscle = document.getElementById("muscleSelect").value;
  const libraryDiv = document.getElementById("videoLibrary");
  libraryDiv.innerHTML = "";

  if(!muscle || !exerciseVideosLibrary[muscle]) return;

  exerciseVideosLibrary[muscle].forEach((ex, index) => {
    const div = document.createElement("div");
    div.classList.add("video-card");
    div.innerHTML = `
      <input type="checkbox" id="video_${index}" data-name="${ex.name}" data-url="${ex.url}">
      <label for="video_${index}">${ex.name}</label>
      <iframe width="200" height="120" src="${ex.url}" frameborder="0" allowfullscreen></iframe>
    `;
    libraryDiv.appendChild(div);
  });
}

// إضافة الفيديوهات المحددة لليوم
function addSelectedVideosToDay() {
  const checkboxes = document.querySelectorAll("#videoLibrary input[type='checkbox']:checked");
  if (checkboxes.length === 0) return alert("Select at least one video");

  const daySelect = document.getElementById("daySelect");
  const container = document.getElementById("workoutContainer");
  let dayCard;

  // إذا المستخدم اختار يوم موجود
  if (daySelect.value !== "") {
    const dayIndex = parseInt(daySelect.value); // ناخد الرقم من الـ value
    const days = container.querySelectorAll(".day-card");
    dayCard = days[dayIndex];
  } else {
    // إذا اختار "New Day"، ننشئ يوم جديد
    createDay("New Day", []);
    const days = container.querySelectorAll(".day-card");
    dayCard = days[days.length - 1]; // آخر يوم هو الجديد
  }

  const exercisesContainer = dayCard.querySelector(".exercise-container");

  // نضيف كل التمارين المختارة
  checkboxes.forEach(cb => {
    const exName = cb.dataset.name;
    const exUrl = cb.dataset.url;

    // نستخدم createExercise مع تمرين جديد يحتوي على الفيديو
    createExercise(exercisesContainer, {
  name: exName,
  url: exUrl,
  equipment: "",
  sets: "",
  setsData: []
});
saveWorkoutData();         // ← تحفظ
populateDayDropdown();     // ← تحديث
  });

  // حفظ البيانات
  saveWorkoutData();

  // إفراغ الاختيارات
  checkboxes.forEach(cb => cb.checked = false);

  // تحديث dropdown بعد إضافة يوم جديد (اختياري)
  populateDayDropdown();
}
// ==========================
// Update Day Dropdown
// ==========================
function populateDayDropdown() {
  const daySelect = document.getElementById("daySelect");
  const container = document.getElementById("workoutContainer");
  
  // البداية: خيار افتراضي لإنشاء يوم جديد
  daySelect.innerHTML = '<option value="">New Day</option>';

  // الحصول على كل الأيام الموجودة في الصفحة
  const days = container.querySelectorAll(".day-card");

  days.forEach((dayCard, index) => {
    const dayNameInput = dayCard.querySelector(".dayNameInput");
    const dayName = dayNameInput ? dayNameInput.value || `Day ${index + 1}` : `Day ${index + 1}`;

    const option = document.createElement("option");
    option.value = index; // قيمة المؤشر للإشارة لليوم الصحيح
    option.textContent = dayName;

    daySelect.appendChild(option);
  });
}
function initializeRestTimer(containerId, startSoundPath, endSoundPath) {
  const display = document.getElementById('restDisplay');
  const input = document.getElementById('restTimeInput');
  const startStopBtn = document.getElementById('startStopBtn');
  const resetBtn = document.getElementById('resetBtn');

  let timeLeft = parseInt(input.value) || 60;
  let interval;
  let running = false;
  let startAudio, endAudio;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  function updateDisplay() {
    display.textContent = formatTime(timeLeft);
  }

  function startTimer() {
    timeLeft = parseInt(input.value);
    if (!timeLeft || timeLeft < 1) return alert("Enter valid time");

    // تشغيل صوت البداية متواصل
    startAudio = new Audio(startSoundPath);
    startAudio.loop = true; // يخلي الصوت يتكرر طول التيمر
    startAudio.play().catch(()=>{});

    display.style.color = "#0077cc";

    interval = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(interval);
        running = false;
        display.textContent = "Time's up! ⏰";
        display.style.color = "red";
        startStopBtn.textContent = "Start";

        // إيقاف صوت البداية فورًا
        if(startAudio) startAudio.pause();
        startAudio.currentTime = 0;

        // تشغيل صوت النهاية مرة واحدة
        endAudio = new Audio(endSoundPath);
        endAudio.play().catch(()=>{});
      }
    }, 1000);

    running = true;
    startStopBtn.textContent = "Stop";
  }

  function stopTimer() {
    clearInterval(interval);
    running = false;
    startStopBtn.textContent = "Start";

    if(startAudio) {
      startAudio.pause();
      startAudio.currentTime = 0;
    }
    if(endAudio) {
      endAudio.pause();
      endAudio.currentTime = 0;
    }
  }

  function resetTimer() {
    stopTimer();
    timeLeft = parseInt(input.value) || 60;
    display.style.color = "#0077cc";
    updateDisplay();
  }

  function toggleTimer() {
    if (!running) {
      startTimer();
    } else {
      stopTimer();
    }
  }

  startStopBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  input.addEventListener('input', () => {
    if(!running) {
      timeLeft = parseInt(input.value) || 60;
      updateDisplay();
    }
  });

  updateDisplay();
}
// ===== GLOBAL DATA =====
// ===== GLOBAL DATA =====
let gender = '', age = 0, heightCalc = 0, weightCalc = 0, activityLevel = 1.2;
let daysCalories = JSON.parse(localStorage.getItem("daysCalories")) || [];
let currentDayIndex = null;

// ===== CALORIE CALCULATOR =====
function calculateCalories() {
  gender = document.getElementById("genderSelect").value;
  age = parseInt(document.getElementById("ageInput").value);
  heightCalc = parseFloat(document.getElementById("heightInputCalc").value);
  weightCalc = parseFloat(document.getElementById("weightInputCalc").value);
  activityLevel = parseFloat(document.getElementById("activitySelect").value);

  if(!gender || !age || !heightCalc || !weightCalc || !activityLevel) {
    return alert("Enter all values!");
  }

  let bmr = gender === "male"
    ? 88.362 + 13.397*weightCalc + 4.799*heightCalc - 5.677*age
    : 447.593 + 9.247*weightCalc + 3.098*heightCalc - 4.330*age;

  const dailyCalories = Math.round(bmr * activityLevel);
  document.getElementById("calorieResult").innerText = `Daily Calories: ${dailyCalories} cal`;

  const today = new Date().toDateString();
  let todayIndex = daysCalories.findIndex(d => d.date === today);
  if(todayIndex === -1){
    daysCalories.push({date: today, totalCalories:0, meals:[], dailyGoal: dailyCalories});
    todayIndex = daysCalories.length-1;
  } else {
    daysCalories[todayIndex].dailyGoal = dailyCalories;
  }

  currentDayIndex = todayIndex;
  saveDays();
  renderCurrentDay();
}

// ===== SAVE =====
function saveDays() {
  localStorage.setItem("daysCalories", JSON.stringify(daysCalories));
}

// ===== DAY LABEL =====
function dayLabel(index){
  const today = new Date().toDateString();
  const diff = Math.floor((new Date(daysCalories[index].date) - new Date(today))/(1000*60*60*24));
  return diff === 0 ? "Today" : diff === -1 ? "Yesterday" : diff === 1 ? "Tomorrow" : new Date(daysCalories[index].date).toLocaleDateString('en-US');
}

// ===== NAVIGATE DAYS =====
function navigateDay(step){
  if(currentDayIndex === null) return;

  const currentDate = new Date(daysCalories[currentDayIndex].date);
  currentDate.setDate(currentDate.getDate() + step);
  const targetDateStr = currentDate.toDateString();

  let existingIndex = daysCalories.findIndex(d=>d.date === targetDateStr);
  if(existingIndex === -1){
    daysCalories.push({date: targetDateStr, totalCalories:0, meals:[], dailyGoal: daysCalories[currentDayIndex].dailyGoal});
    existingIndex = daysCalories.length-1;
  }

  currentDayIndex = existingIndex;
  saveDays();
  renderCurrentDay();
}

// ===== RENDER CURRENT DAY =====
function renderCurrentDay() {
  if(currentDayIndex === null) return;
  const container = document.getElementById("day-Container");
  container.innerHTML = "";

  const day = daysCalories[currentDayIndex];

  const dayCard = document.createElement("div");
  dayCard.classList.add("days-cards");
  dayCard.innerHTML = `
    <h3>${dayLabel(currentDayIndex)}</h3>
    <div class="circle-container">
      <svg class="progress-circle" width="90" height="90">
        <circle class="bg-circle" cx="45" cy="45" r="40"></circle>
        <circle class="fg-circle" cx="45" cy="45" r="40"></circle>
      </svg>
      <div class="circle-text" id="circle-text-${currentDayIndex}">${day.totalCalories} cal</div>
    </div>
    <p class="calories-info" id="calories-info-${currentDayIndex}">${day.dailyGoal} - ${day.totalCalories} = ${Math.max(day.dailyGoal-day.totalCalories,0)} cal</p>
    <div class="meals" id="meals-${currentDayIndex}"></div>
    <div class="add-meal-container">
      <input type="text" placeholder="Meal Name" class="meal-name-input">
      <input type="number" placeholder="Calories" class="meal-cal-input">
      <button class="save-meal-btn">+</button>
    </div>
    <div class="day-nav">
      <button id="prevDay">&#8592;</button>
      <button id="nextDay">&#8594;</button>
    </div>
  `;
  container.appendChild(dayCard);

  // render meals
  const mealsDiv = dayCard.querySelector(".meals");
  day.meals.forEach((meal,index)=>{
    const mealDiv = document.createElement("div");
    mealDiv.style.display = "flex";
    mealDiv.style.justifyContent = "space-between";
    mealDiv.style.marginBottom = "4px";
    mealDiv.innerHTML = `
      <input type="text" value="${meal.name}" class="edit-meal-name" data-index="${index}" style="flex:1; margin-right:5px;">
      <input type="number" value="${meal.calories}" class="edit-meal-cal" data-index="${index}" style="width:70px; margin-right:5px;">
      <button class="delete-meal" data-index="${index}">x</button>
    `;
    mealsDiv.appendChild(mealDiv);
  });

  updateDayCircle(currentDayIndex);
  dayCard.querySelector("#prevDay").onclick = ()=> navigateDay(-1);
  dayCard.querySelector("#nextDay").onclick = ()=> navigateDay(1);
}

// ===== ADD / DELETE / EDIT MEALS =====
document.addEventListener("click", function(e){
  if(currentDayIndex === null) return;
  const day = daysCalories[currentDayIndex];

  if(e.target.classList.contains("save-meal-btn")){
    const dayCard = document.querySelector(".days-cards");
    const mealName = dayCard.querySelector(".meal-name-input").value.trim();
    const mealCal = parseInt(dayCard.querySelector(".meal-cal-input").value);
    if(!mealName || !mealCal) return alert("Enter meal name and calories");
    day.meals.push({name: mealName, calories: mealCal});
    day.totalCalories += mealCal;
    saveDays(); renderCurrentDay();
  }

  if(e.target.classList.contains("delete-meal")){
    const index = parseInt(e.target.dataset.index);
    day.totalCalories -= day.meals[index].calories;
    day.meals.splice(index,1);
    saveDays(); renderCurrentDay();
  }
});

document.addEventListener("input", function(e){
  if(currentDayIndex === null) return;
  const day = daysCalories[currentDayIndex];

  if(e.target.classList.contains("edit-meal-name")){
    day.meals[parseInt(e.target.dataset.index)].name = e.target.value;
    saveDays();
  }
  if(e.target.classList.contains("edit-meal-cal")){
    const idx = parseInt(e.target.dataset.index);
    const oldCal = day.meals[idx].calories;
    const newCal = parseInt(e.target.value) || 0;
    day.totalCalories += (newCal - oldCal);
    day.meals[idx].calories = newCal;
    saveDays(); updateDayCircle(currentDayIndex);
  }
});

// ===== UPDATE SVG CIRCLE =====
function updateDayCircle(dayIndex){
  const day = daysCalories[dayIndex];
  const totalCalories = day.totalCalories;
  const dailyGoal = day.dailyGoal || 0;
  const fg = document.querySelector(".fg-circle");
  const radius = 40, circumference = 2 * Math.PI * radius;
  const percent = dailyGoal ? Math.min(totalCalories/dailyGoal,1) : 0;
  fg.style.strokeDasharray = circumference;
  fg.style.strokeDashoffset = circumference * (1 - percent);
  document.getElementById(`circle-text-${dayIndex}`).innerText = totalCalories + " cal";
  document.getElementById(`calories-info-${dayIndex}`).innerText = `${dailyGoal} - ${totalCalories} = ${Math.max(dailyGoal-totalCalories,0)} cal`;
}
//----------------search tool------------//
document.addEventListener("DOMContentLoaded", function() {

    const searchBtn = document.getElementById("searchBtn");
    const foodInput = document.getElementById("foodInput");
    const resultsDiv = document.getElementById("results");

    // ===== بيانات المكونات =====
    const foods = [
      {name:"egg", calories:68, protein:5.5, carbs:0.6, fat:4.8},
      {name:"bread", calories:80, protein:2.6, carbs:15, fat:1.2},
      {name:"cheese", calories:113, protein:7, carbs:0.9, fat:9.3},
      {name:"chicken", calories:165, protein:31, carbs:0, fat:3.6},
      {name:"rice", calories:130, protein:2.4, carbs:28, fat:0.3},
      {name:"banana", calories:89, protein:1.1, carbs:23, fat:0.3},
      {name:"apple", calories:52, protein:0.3, carbs:14, fat:0.2},
      {name:"tomato", calories:18, protein:0.9, carbs:3.9, fat:0.2},
      {name:"potato", calories:77, protein:2, carbs:17, fat:0.1},
      {name:"carrot", calories:41, protein:0.9, carbs:10, fat:0.2},
      {name:"beef", calories:250, protein:26, carbs:0, fat:17},
      {name:"salmon", calories:208, protein:20, carbs:0, fat:13}
      // ممكن تضيفي باقي المكونات
    ];

    // ===== وظيفة البحث =====
    searchBtn.addEventListener("click", function() {
        const query = foodInput.value.toLowerCase().trim();
        resultsDiv.innerHTML = "";

        if(!query){
            alert("Please enter food");
            return;
        }

        const queryItems = query.split(" ");
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        let found = false;

        queryItems.forEach(item => {
            const food = foods.find(f => f.name.toLowerCase() === item);
            if(food){
                found = true;
                totalCalories += food.calories;
                totalProtein += food.protein;
                totalCarbs += food.carbs;
                totalFat += food.fat;

                resultsDiv.innerHTML += `
                    <div class="food-item">
                        <span>${food.name}</span>
                        <span>${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g</span>
                    </div>
                `;
            }
        });

        if(!found){
            resultsDiv.innerHTML = "No results found";
            return;
        }

        resultsDiv.innerHTML += `
            <div class="total">
                Total: ${totalCalories} kcal | P: ${totalProtein}g | C: ${totalCarbs}g | F: ${totalFat}g
            </div>
        `;
    });

});


function updateNavbar() {
  const username = localStorage.getItem("username");

  const loginItem = document.getElementById("loginItem");
  const avatar = document.getElementById("avatar");

  // ❗ لو العناصر مش موجودة استني شوية وجرب تاني
  if (!loginItem || !avatar) {
    setTimeout(updateNavbar, 50);
    return;
  }

   if (username) {
    loginItem.style.display = "none";
    avatar.style.display = "flex";

    avatar.textContent = username.trim().charAt(0).toUpperCase();

    avatar.onclick = function () {
      window.location.href = "profile.html";
    };

    avatar.style.cursor = "pointer";

  } else {
    loginItem.style.display = "block";
    avatar.style.display = "none";
  }
}
window.addEventListener("load", updateNavbar);

window.addEventListener("load", function(){
  const today = new Date().toDateString();
  let todayIndex = daysCalories.findIndex(d=>d.date===today);
  if(todayIndex === -1) { daysCalories.push({date: today, totalCalories:0, meals:[], dailyGoal:0}); todayIndex = daysCalories.length-1; }
  currentDayIndex = todayIndex;
  renderCurrentDay();
});
window.addEventListener("load", function() {
    // 1️⃣ تحميل كل الأيام والتمارين من localStorage
    loadWorkoutData();

    // 2️⃣ تحديث dropdown بالأيام الموجودة
    populateDayDropdown();

    // 3️⃣ تهيئة التايمر
    initializeRestTimer("timerContainer", "../static/timer.mp3", "../static/alarm.wav");
  
    

});



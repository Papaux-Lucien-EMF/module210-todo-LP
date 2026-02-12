const apiEndpoint = "https://container-todo-app-papaux-lucien.purplemoss-90baa50f.switzerlandnorth.azurecontainerapps.io/api/tasks";
const countryApiEndpoint = "https://function-210-papaux-lucien-dhcscqfehdhxd9gc.northeurope-01.azurewebsites.net/api/countCountries";

$(document).ready(function () {
  const $background = $(".background");
  const $bgButton = $("#bg-button");
  const $bgColor = $("#bg-color");
  let customBg = false;

  updateBackgroundGradient();
  setInterval(updateBackgroundGradient, 60000);
  loadTasks();

  // --- Todo add ---
  $("#todo-form").on("submit", async function(e){
    e.preventDefault();
    const desc = $("#todo-input").val().trim();
    if(!desc) return;

    await fetch(apiEndpoint,{
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ description: desc })
    });

    $("#todo-input").val("");
    loadTasks();
  });

  // --- Todo check ---
  $("#todo-list").on("click", ".task-toggle", async function(){
    const $li = $(this).closest("li");
    const id = $li.data("id");
    const completed = !$li.hasClass("completed");
    const text = $li.find(".task-text").text();

    $li.addClass("pop");

    await fetch(apiEndpoint,{
      method:"PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id, description: text, completed })
    });

    setTimeout(loadTasks, 200);
  });

  // --- Todo delete avec animation ---
  $("#todo-list").on("click", ".delete-btn", async function(){
    const $li = $(this).closest("li");
    const id = $li.data("id");

    $li.addClass("slide-out");

    setTimeout(async ()=> {
      await fetch(`${apiEndpoint}?id=${id}`, { method:"DELETE" });
      loadTasks();
    }, 600);
  });

  // --- Background picker ---
  $bgButton.on("click", ()=> $bgColor.click());
  $bgColor.on("input", function(){
    const color = $(this).val();
    $background.css("background", color);
    customBg = true;

    // Contraste texte
    const rgb = hexToRgb(color);
    const brightness = (rgb.r*299 + rgb.g*587 + rgb.b*114)/1000;
    if(brightness > 180){
      $(".app-container, li, #todo-input, #task-stats, #country-count, #refresh-countries, #app-title").css("color","black");
    } else {
      $(".app-container, li, #todo-input, #task-stats, #country-count, #refresh-countries, #app-title").css("color","white");
    }
  });

  function hexToRgb(hex) {
    let c = hex.replace("#",""), r=0,g=0,b=0;
    if(c.length===3){ r=parseInt(c[0]+c[0],16); g=parseInt(c[1]+c[1],16); b=parseInt(c[2]+c[2],16); }
    else{ r=parseInt(c.substring(0,2),16); g=parseInt(c.substring(2,4),16); b=parseInt(c.substring(4,6),16); }
    return {r,g,b};
  }

  // --- Load tasks & progress ---
  async function loadTasks(){
    try {
      const res = await fetch(apiEndpoint);
      const tasks = await res.json();
      tasks.sort((a,b)=> a.completed-b.completed);

      $("#todo-list").empty();
      tasks.forEach(task=>{
        const li = $("<li>").data("id",task.id);
        if(task.completed) li.addClass("completed");

        li.append(
          $("<input>").attr("type","checkbox").addClass("task-toggle").prop("checked", task.completed),
          $("<span>").addClass("task-text").text(task.description),
          $("<button>").addClass("delete-btn").text("✖")
        );
        li.addClass("pop");
        $("#todo-list").append(li);
      });

      updateProgress(tasks);
    } catch(e){
      console.error("Erreur chargement tasks:",e);
    }
  }

  function updateProgress(tasks){
    const total = tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    const percent = total===0 ? 0 : Math.round((completed/total)*100);

    const $bar = $("#progress-bar");
    $bar.css("width", percent+"%");

    if(percent<30) $bar.css("background","linear-gradient(90deg,#ff4d6d,#ff9966)");
    else if(percent<70) $bar.css("background","linear-gradient(90deg,#fcd34d,#facc15)");
    else $bar.css("background","linear-gradient(90deg,#00f5ff,#00ff94)");

    $("#task-stats").text(`${completed} / ${total} completed (${percent}%)`);
  }

  // --- Background dynamique ---
  function updateBackgroundGradient(){
    if(customBg) return;

    const hour = new Date().getHours();
    let color1,color2;

    if(hour>=6 && hour<12){ color1="#87cefa"; color2="#00bfff"; }
    else if(hour>=12 && hour<18){ color1="#00bfff"; color2="#1e90ff"; }
    else if(hour>=18 && hour<21){ color1="#2c3e50"; color2="#34495e"; }
    else{ color1="#0f2027"; color2="#203a43"; }

    $background.css("background", `linear-gradient(135deg, ${color1}, ${color2})`);
  }

  // --- Refresh countries avec animation ---
  $("#refresh-countries").on("click", async ()=>{
    try {
      const res = await fetch(countryApiEndpoint);
      if(!res.ok) throw new Error(`Erreur API : ${res.status}`);
      const data = await res.json();

      $("#country-count").text(data.message).addClass("show");
      setTimeout(()=> $("#country-count").removeClass("show"), 1500);
    } catch(e){
      console.error("Erreur chargement pays:",e);
      $("#country-count").text("Erreur de chargement").addClass("show");
      setTimeout(()=> $("#country-count").removeClass("show"), 1500);
    }
  });
});

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

  $("#todo-form").on("submit", async function(e){
    e.preventDefault();
    const desc = $("#todo-input").val().trim();
    if(!desc) return;

    await fetch(apiEndpoint,{
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ description: desc, pinned:false })
    });

    $("#todo-input").val("");
    loadTasks();
  });

  $("#todo-list").on("click", ".task-toggle", async function(){
    const $li = $(this).closest("li");
    const id = $li.data("id");
    const completed = !$li.hasClass("completed");
    const text = $li.find(".task-text").text();
    const pinned = $li.hasClass("pinned");

    await fetch(apiEndpoint,{
      method:"PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id, description: text, completed, pinned })
    });

    loadTasks();
  });

  $("#todo-list").on("click", ".pin-btn", async function () {
    const $li = $(this).closest("li");
    const id = $li.data("id");
    const completed = $li.hasClass("completed");
    const pinned = !$li.hasClass("pinned");
    const description = $li.find(".task-text").text();

    await fetch(apiEndpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, description, completed, pinned }),
    });

    loadTasks();
  });

  $bgButton.on("click", ()=> $bgColor.click());
  $bgColor.on("input", function(){
    const color = $(this).val();
    $background.css("background", color);
    customBg = true;
  });

  async function loadTasks(){
    try {
      const res = await fetch(apiEndpoint);
      const tasks = await res.json();

      tasks.sort((a,b) => {
        if(a.pinned && !b.pinned) return -1;
        if(!a.pinned && b.pinned) return 1;
        return a.completed - b.completed;
      });

      $("#todo-list").empty();
      tasks.forEach(task => {
        const li = $("<li>").data("id", task.id);
        if(task.completed) li.addClass("completed");
        if(task.pinned) li.addClass("pinned");

        li.append(
          $("<input>").attr("type","checkbox").addClass("task-toggle").prop("checked", task.completed),
          $("<span>").addClass("task-text").text(task.description),
          $("<button>").addClass("pin-btn").text("📌")
        );

        $("#todo-list").append(li);
      });

      updateProgress(tasks);
      enableDragDelete();
    } catch(e){
      console.error("Erreur chargement tasks:", e);
    }
  }

  function updateProgress(tasks){
    const total = tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    const percent = total===0 ? 0 : Math.round((completed/total)*100);

    $("#progress-bar").css("width", percent+"%");
    $("#task-stats").text(`${completed} / ${total} completed (${percent}%)`);
  }

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

  /* ===== Refresh Countries SANS POPUP ===== */
  $("#refresh-countries").on("click", async ()=>{
    try {
      const res = await fetch(countryApiEndpoint);
      if(!res.ok) throw new Error();
      const data = await res.json();

      $("#country-count").text(data.message);
    } catch(e){
      $("#country-count").text("Erreur de chargement");
    }
  });

  function enableDragDelete(){
    const $trash = $("#trash");
    $("li").attr("draggable", true);

    $("li").off("dragstart").on("dragstart", function(e){
      e.originalEvent.dataTransfer.setData("text/plain", $(this).data("id"));
    });

    $trash.off("dragover").on("dragover", function(e){
      e.preventDefault();
      $(this).addClass("drag-over");
    });

    $trash.off("dragleave").on("dragleave", function(){
      $(this).removeClass("drag-over");
    });

    $trash.off("drop").on("drop", async function(e){
      e.preventDefault();
      $(this).removeClass("drag-over");
      const id = e.originalEvent.dataTransfer.getData("text/plain");

      await fetch(`${apiEndpoint}?id=${id}`, { method:"DELETE" });
      loadTasks();
    });
  }

});

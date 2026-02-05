//const apiEndpoint = "http://20.107.179.74/api/tasks";
const apiEndpoint = "https://container-todo-app-papaux-lucien.purplemoss-90baa50f.switzerlandnorth.azurecontainerapps.io/api/tasks";
const countryApiEndpoint = "https://function-210-papaux-lucien-dhcscqfehdhxd9gc.northeurope-01.azurewebsites.net/api/countCountries";

$(document).ready(function () {
  // Charger les tâches au démarrage
  loadTasks();

  // Charger le nombre de pays au démarrage
  loadCountries();

  // Ajouter une nouvelle tâche
  $("#todo-form").on("submit", async function (e) {
    e.preventDefault();

    const description = $("#todo-input").val().trim();
    if (description === "") return;

    const task = { description: description };

    try {
      await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      loadTasks();
      $("#todo-input").val(""); // Réinitialiser le champ
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche :", error);
    }
  });

  // Marquer une tâche comme terminée (ou non)
  $("#todo-list").on("click", ".task-toggle", async function () {
    const $taskElement = $(this).closest("li");
    const taskId = $taskElement.data("id");
    const isCompleted = $taskElement.hasClass("completed");

    const description = $taskElement.contents().filter(function () {
      return this.nodeType === 3; // Node type 3 = texte
    }).text().trim();

    if (!description) {
      console.error("Erreur : la description de la tâche est vide !");
      return;
    }

    const updatedTask = { id: taskId, description: description, completed: !isCompleted };

    try {
      await fetch(apiEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      loadTasks();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche :", error);
    }
  });

  // Supprimer une tâche
  $("#todo-list").on("click", ".delete-btn", async function (e) {
    e.stopPropagation();
    const taskId = $(this).parent().data("id");

    try {
      await fetch(`${apiEndpoint}?id=${taskId}`, {
        method: "DELETE",
      });
      loadTasks();
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche :", error);
    }
  });

  // Charger les tâches depuis l'API
  async function loadTasks() {
    try {
      const response = await fetch(apiEndpoint);
      const tasks = await response.json();

      tasks.sort((a, b) => a.completed - b.completed);

      $("#todo-list").empty();
      tasks.forEach((task) => {
        const listItem = $("<li>")
          .text(task.description)
          .data("id", task.id)
          .addClass(task.completed ? "completed" : "")
          .append(
            $("<button>")
              .text("Delete")
              .addClass("delete-btn")
          )
          .prepend(
            $("<input>")
              .attr("type", "checkbox")
              .addClass("task-toggle")
              .prop("checked", task.completed)
          );

        $("#todo-list").append(listItem);
      });
    } catch (error) {
      console.error("Erreur lors du chargement des tâches :", error);
    }
  }

  // Charger le nombre de pays depuis l'API Azure Function
  async function loadCountries() {
    try {
      const response = await fetch(countryApiEndpoint);
      if (!response.ok) throw new Error(`Erreur API : ${response.status}`);
      const data = await response.json();

      // Afficher le résultat dans un div avec id="country-count"
      $("#country-count").text(data.message);
    } catch (error) {
      console.error("Erreur lors du chargement des pays :", error);
      $("#country-count").text("Erreur de chargement");
    }
  }
});

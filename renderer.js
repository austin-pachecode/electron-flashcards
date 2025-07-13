window.addEventListener("DOMContentLoaded", async () => {
  const examList = document.getElementById("exam-list");
  const folders = await window.api.getExamFolders();

  folders.forEach((folder) => {
    const li = document.createElement("li");
    li.textContent = folder;
    li.style.cursor = "pointer";
    li.onclick = async () => {
      const info = await window.api.getExamInformation(folder);
      renderExamInfo(folder, info);
    };
    examList.appendChild(li);
  });
});

function renderExamInfo(folder, info) {
  document.body.innerHTML = `
    <h1>${info.title}</h1>
    <p>${info.description}</p>
    <p><strong>Difficulty:</strong> ${info.difficulty}</p>
    <p><strong>Version:</strong> ${info.version}</p>
    <button id="start-btn">Start Flashcards</button>
  `;

  document.getElementById("start-btn").onclick = async () => {
    const flashcards = await window.api.getFlashcardImages(folder);
    renderFlashcards(folder, flashcards);
  };
}

function renderFlashcards(folder, flashcards) {
  let index = 0;
  let showingAnswer = false;

  const container = document.createElement("div");
  container.innerHTML = `
    <img id="flashcard-img" style="max-width: 100%; max-height: 80vh;" />
    <br/>
    <button id="flip-btn">Flip</button>
    <button id="prev-btn">Prev</button>
    <button id="next-btn">Next</button>
  `;
  document.body.innerHTML = "";
  document.body.appendChild(container);

  const img = document.getElementById("flashcard-img");
  const flipBtn = document.getElementById("flip-btn");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");

  function updateCard() {
    const current = flashcards[index];
    const imagePath = showingAnswer ? current.a : current.q;
    img.src = imagePath;
  }

  flipBtn.onclick = () => {
    showingAnswer = !showingAnswer;
    updateCard();
  };

  nextBtn.onclick = () => {
    if (index < flashcards.length - 1) {
      index++;
      showingAnswer = false;
      updateCard();
    }
  };

  prevBtn.onclick = () => {
    if (index > 0) {
      index--;
      showingAnswer = false;
      updateCard();
    }
  };

  updateCard();
}

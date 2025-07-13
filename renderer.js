window.addEventListener("DOMContentLoaded", async () => {
  const examList = document.getElementById("exam-list");
  const folders = await window.api.getExamFolders();

  folders.forEach((folder) => {
    const li = document.createElement("li");
    li.textContent = folder;
    li.style.cursor = "pointer";
    li.onclick = async () => {
      fadeOut(document.getElementById("app"), async () => {
        const info = await window.api.getExamInformation(folder);
        renderExamInfo(folder, info);
      });
    };
    examList.appendChild(li);
  });
});

document.getElementById("import-exam-btn").onclick = async () => {
  const result = await window.api.importExamFolder();
  if (result?.success) {
    alert(`Imported: ${result.folder}`);
    location.reload();
  } else if (result?.error) {
    alert(`Import failed: ${result.error}`);
  }
};

function renderExamInfo(folder, info) {
  document.body.innerHTML = `
    <div class="exam-info-container">
      <h1 class="exam-title">${info.title}</h1>
      <p class="exam-description">${info.description}</p>
      <div class="exam-meta">
        <div><strong>Difficulty:</strong> ${info.difficulty}</div>
        <div><strong>Version:</strong> ${info.version}</div>
      </div>
      <button id="start-btn" class="start-button">Start Flashcards</button>
    </div>
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
  <div class="flashcard-header">
    <button id="back-btn" class="back-button">← Back to Exams</button>
    <div class="flashcard-status" id="flashcard-status">Card 1 of ${flashcards.length}</div>
  </div>
  <div id="zoom-wrapper">
    <img id="flashcard-img" draggable="false"/>
  </div>
  <div class="flashcard-controls">
    <button id="flip-btn" class="control-btn primary-btn">Flip</button>
    <button id="prev-btn" class="control-btn">Prev</button>
    <button id="next-btn" class="control-btn">Next</button>
  </div>
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

    img.onload = () => {
      requestAnimationFrame(() => {
        img.style.transform = `scale(1)`;
        scale = 1;
        minScale = 1;

        zoomWrapper.scrollTop = 0;
        zoomWrapper.scrollLeft = 0;
      });
    };

    img.src = imagePath;
    document.getElementById("flashcard-status").textContent = `Card ${
      index + 1
    } of ${flashcards.length}`;
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
  document.getElementById("back-btn").onclick = () => {
    window.location.reload(); // simplest way to re-show exam list
  };
  let scale = 1;
  let isDragging = false;
  let startX, startY, scrollLeft, scrollTop;

  const zoomWrapper = document.getElementById("zoom-wrapper");

  const maxScale = 3;

  zoomWrapper.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.min(Math.max(minScale, scale + delta), maxScale);
    img.style.transform = `scale(${scale})`;
  });

  zoomWrapper.addEventListener("mousedown", (e) => {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.pageX - zoomWrapper.offsetLeft;
    startY = e.pageY - zoomWrapper.offsetTop;
    scrollLeft = zoomWrapper.scrollLeft;
    scrollTop = zoomWrapper.scrollTop;
    img.style.cursor = "grabbing";
  });

  zoomWrapper.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const x = e.pageX - zoomWrapper.offsetLeft;
    const y = e.pageY - zoomWrapper.offsetTop;
    const walkX = x - startX;
    const walkY = y - startY;
    zoomWrapper.scrollLeft = scrollLeft - walkX;
    zoomWrapper.scrollTop = scrollTop - walkY;
  });

  zoomWrapper.addEventListener("mouseup", () => {
    isDragging = false;
    img.style.cursor = "grab";
  });

  zoomWrapper.addEventListener("mouseleave", () => {
    isDragging = false;
    img.style.cursor = "grab";
  });

  updateCard();
}

function fadeOut(element, callback) {
  element.style.opacity = 1;
  (function fade() {
    if ((element.style.opacity -= 0.1) < 0.1) {
      element.style.display = "none";
      callback();
    } else {
      requestAnimationFrame(fade);
    }
  })();
}

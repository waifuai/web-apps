/* script.js */

document.addEventListener('DOMContentLoaded', () => {
  const traits = {}; // Store traits with scores

  // Trait Management
  const traitNameInput = document.getElementById('trait-name');
  const friendlinessScoreInput = document.getElementById('friendliness-score');
  const dominanceScoreInput = document.getElementById('dominance-score');
  const addTraitBtn = document.getElementById('add-trait-btn');
  const traitsList = document.getElementById('traits');

  addTraitBtn.addEventListener('click', () => {
    const traitName = traitNameInput.value.trim();
    const friendliness = parseFloat(friendlinessScoreInput.value);
    const dominance = parseFloat(dominanceScoreInput.value);

    if (traitName && !isNaN(friendliness) && !isNaN(dominance)) {
      traits[traitName] = { friendliness, dominance };
      traitNameInput.value = '';
      friendlinessScoreInput.value = '0';
      dominanceScoreInput.value = '0';
      renderTraits();
    } else {
      alert('Please enter valid trait name and scores.');
    }
  });

  function renderTraits() {
    traitsList.innerHTML = '';
    for (const trait in traits) {
      const li = document.createElement('li');
      li.textContent = `${trait} - Friendliness: ${traits[trait].friendliness}, Dominance: ${traits[trait].dominance}`;
      traitsList.appendChild(li);
    }
  }


  // Personality Profiling
  const personalityDescriptionInput = document.getElementById('personality-description');
  const updatePersonalityBtn = document.getElementById('update-personality-btn');
  const friendlinessDisplay = document.getElementById('friendliness-display');
  const dominanceDisplay = document.getElementById('dominance-display');

  updatePersonalityBtn.addEventListener('click', () => {
    const description = personalityDescriptionInput.value.toLowerCase();
    const personalityProfile = calculatePersonalityProfile(description, traits);
    friendlinessDisplay.textContent = personalityProfile.friendliness.toFixed(2);
    dominanceDisplay.textContent = personalityProfile.dominance.toFixed(2);
  });

  function calculatePersonalityProfile(description, traitDictionary) {
    let friendlinessScore = 0;
    let dominanceScore = 0;
    let traitCount = 0;

    for (const trait in traitDictionary) {
      if (description.includes(trait.toLowerCase())) {
        friendlinessScore += traitDictionary[trait].friendliness;
        dominanceScore += traitDictionary[trait].dominance;
        traitCount++;
      }
    }

    if (traitCount > 0) {
      return {
        friendliness: friendlinessScore / traitCount,
        dominance: dominanceScore / traitCount
      };
    } else {
      return { friendliness: 0, dominance: 0 }; // Default profile if no traits found
    }
  }

  // Company Matching (basic placeholder - needs candidate input and ranking logic)
  const jobDescriptionInput = document.getElementById('job-description');
  const analyzeJobBtn = document.getElementById('analyze-job-btn');
  const candidateList = document.getElementById('candidate-list');

  analyzeJobBtn.addEventListener('click', () => {
    const jobDescription = jobDescriptionInput.value.toLowerCase();
    const jobProfile = calculatePersonalityProfile(jobDescription, traits);

    // Example candidates (replace with actual candidate data)
    const candidates = [
      { name: 'Alice', profile: { friendliness: 0.8, dominance: 0.2 } },
      { name: 'Bob', profile: { friendliness: 0.1, dominance: 0.7 } },
      { name: 'Charlie', profile: { friendliness: 0.5, dominance: -0.3 } }
    ];

    const rankedCandidates = rankCandidates(candidates, jobProfile);
    renderCandidates(rankedCandidates, jobProfile);
  });


  function euclideanDistance(profile1, profile2) {
    const friendlinessDiff = profile1.friendliness - profile2.friendliness;
    const dominanceDiff = profile1.dominance - profile2.dominance;
    return Math.sqrt(friendlinessDiff**2 + dominanceDiff**2);
  }

  function rankCandidates(candidates, jobProfile) {
    return candidates.map(candidate => {
      const distance = euclideanDistance(candidate.profile, jobProfile);
      return { ...candidate, distance };
    }).sort((a, b) => a.distance - b.distance); // Sort by distance (lower is better)
  }

  function renderCandidates(rankedCandidates, jobProfile) {
    candidateList.innerHTML = '';
    rankedCandidates.forEach(candidate => {
      const li = document.createElement('li');
      li.textContent = `${candidate.name} - Compatibility Score: ${(1 - candidate.distance).toFixed(2)} (Friendliness: ${candidate.profile.friendliness.toFixed(2)}, Dominance: ${candidate.profile.dominance.toFixed(2)})`;
      candidateList.appendChild(li);
    });
  }

});
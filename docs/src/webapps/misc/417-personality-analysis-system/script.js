document.addEventListener('DOMContentLoaded', () => {
  // --- Trait Management ---
  const traitForm = document.getElementById('trait-form');
  const traitsTableBody = document.getElementById('traits-table').querySelector('tbody');
  let traits = [];

  function renderTraits() {
    traitsTableBody.innerHTML = '';
    traits.forEach(trait => {
      const row = traitsTableBody.insertRow();
      row.insertCell().textContent = trait.name;
      row.insertCell().textContent = trait.friendliness;
      row.insertCell().textContent = trait.dominance;
    });
  }

  traitForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('trait-name').value;
    const friendliness = parseFloat(document.getElementById('friendliness-score').value);
    const dominance = parseFloat(document.getElementById('dominance-score').value);
    traits.push({ name, friendliness, dominance });
    renderTraits();
    traitForm.reset();
  });

  // --- Personality Profiling ---
  const personalityForm = document.getElementById('personality-form');
  const personalitiesTableBody = document.getElementById('personalities-table').querySelector('tbody');
  let personalities = [];

  function renderPersonalities() {
    personalitiesTableBody.innerHTML = '';
    personalities.forEach(person => {
      const row = personalitiesTableBody.insertRow();
      row.insertCell().textContent = person.name;
      row.insertCell().textContent = person.description;
      row.insertCell().textContent = person.friendliness;
      row.insertCell().textContent = person.dominance;
    });
  }

  personalityForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('person-name').value;
    const description = document.getElementById('personality-description').value;
    const friendliness = parseFloat(document.getElementById('person-friendliness').value);
    const dominance = parseFloat(document.getElementById('person-dominance').value);
    personalities.push({ name, description, friendliness, dominance });
    renderPersonalities();
    personalityForm.reset();
  });

  // --- Company Matching ---
  const jobProfileForm = document.getElementById('job-profile-form');
  const candidateRankingTableBody = document.getElementById('candidate-ranking-table').querySelector('tbody');

  function calculateEuclideanDistance(profile1, profile2) {
    const diffFriendliness = profile1.friendliness - profile2.friendliness;
    const diffDominance = profile1.dominance - profile2.dominance;
    return Math.sqrt(diffFriendliness * diffFriendliness + diffDominance * diffDominance);
  }

  function rankCandidates(jobProfile) {
    const compatibilityScores = personalities.map(person => {
      const distance = calculateEuclideanDistance(jobProfile, person);
      return { person, score: distance };
    });

    compatibilityScores.sort((a, b) => a.score - b.score); // Sort by ascending distance (lower is better)

    candidateRankingTableBody.innerHTML = '';
    compatibilityScores.forEach((item, index) => {
      const row = candidateRankingTableBody.insertRow();
      row.insertCell().textContent = index + 1; // Rank
      row.insertCell().textContent = item.person.name;
      row.insertCell().textContent = item.score.toFixed(2); // Compatibility Score
    });
  }


  jobProfileForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const jobFriendliness = parseFloat(document.getElementById('job-friendliness').value);
    const jobDominance = parseFloat(document.getElementById('job-dominance').value);
    const jobProfile = { friendliness: jobFriendliness, dominance: jobDominance };
    rankCandidates(jobProfile);
  });
});
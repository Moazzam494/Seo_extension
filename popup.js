document.addEventListener('DOMContentLoaded', function() {
    const keywordInput = document.getElementById('keywordInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingDiv = document.getElementById('loading');
    const errorMessageDiv = document.getElementById('errorMessage');
    const resultsDiv = document.getElementById('results'); 
    const mainKeywordResultDiv = document.getElementById('mainKeywordResult'); 
    const recommendedKeywordsSection = document.getElementById('recommendedKeywordsSection'); 
    const toggleRecommendedBtn = document.getElementById('toggleRecommendedBtn');
    const recommendedListDiv = document.getElementById('recommendedList'); 
    let allPrimaryKeywords = []; 

    function showLoading() {
        loadingDiv.classList.remove('hidden');
        errorMessageDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden'); 
        mainKeywordResultDiv.innerHTML = ''; 
        recommendedListDiv.innerHTML = ''; 
        recommendedKeywordsSection.classList.add('hidden'); 
        recommendedListDiv.classList.add('hidden'); 
        toggleRecommendedBtn.textContent = 'Show Recommended Keywords';
    }

    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
        hideLoading();
        resultsDiv.classList.add('hidden'); 
    }

    function generateKeywordCardHTML(item) {
        const serp = item.serp_analysis;
        return `
            <div class="keyword-result-card">
                <div class="keyword-title-row">
                    <h3>${item.keyword}</h3>
                    <span class="category-tag">${item.category}</span>
                </div>
                <div class="keyword-details">
                    <p><strong>Competition:</strong> <span class="value-text">${item.competition}</span></p>
                    <p><strong>Comp. Index:</strong> <span class="value-text">${item.competition_index}</span></p>
                    <p><strong>Difficulty:</strong> <span class="value-text">${item.difficulty}</span></p>
                    <p><strong>CPC:</strong> <span class="value-text">$${item.cpc.toFixed(2)}</span></p>
                    <p><strong>Traffic:</strong> <span class="value-text">${item.potential_traffic}</span></p>
                    <p><strong>Search Volume:</strong> <span class="value-text">${item.search_volume}</span></p>
                    <p><strong>Tail:</strong> <span class="value-text">${item.tail_type}</span></p>
                    <p><strong>Trend:</strong> <span class="value-text">${item.trend}</span></p>
                    <p><strong>Competitors:</strong> <span class="value-text">${serp.competitors}</span></p>
                    <div class="serp-details">
                         <h4>SERP Meta Data:</h4>
                         <ul>
                            ${(serp.meta_data.meta_description || []).map(desc => `<li>Description: ${desc}</li>`).join('')}
                            ${(serp.meta_data.h1 || []).map(h => `<li>H1: ${h}</li>`).join('')}
                            ${(serp.meta_data.h2 || []).map(h => `<li>H2: ${h}</li>`).join('')}
                            ${(serp.meta_data.h3 || []).map(h => `<li>H3: ${h}</li>`).join('')}
                            ${(serp.meta_data.h4 || []).map(h => `<li>H4: ${h}</li>`).join('')}
                            ${(serp.top_domains && serp.top_domains.length > 0) ? `<li>Top Domains: ${serp.top_domains.join(', ')}</li>` : ''}
                            ${(serp.trust_score !== undefined) ? `<li>Trust Score: ${serp.trust_score}</li>` : ''}
                            ${(serp.title_match_count !== undefined) ? `<li>Title Matches: ${serp.title_match_count}</li>` : ''}
                         </ul>
                         ${(Object.keys(serp.meta_data).every(k => serp.meta_data[k].length === 0) && serp.top_domains.length === 0 && serp.trust_score === 0 && serp.title_match_count === 0) ? '<p>No detailed SERP data available.</p>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    analyzeBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            showError("Please enter a keyword.");
            return;
        }

        showLoading(); 

        try {
            const backendUrl = `http://127.0.0.1:5000/seo?q=${encodeURIComponent(keyword)}`;
            const response = await fetch(backendUrl);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Backend responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                if (data.status && data.status === "blocked") {
                    showError("Backend error: Google detected automated requests. Please try again later or try a different keyword.");
                } else {
                    showError(`Backend error: ${data.error}`);
                }
                return;
            }

            hideLoading();
            resultsDiv.classList.remove('hidden'); 

            allPrimaryKeywords = data.primary_keywords; 

            if (allPrimaryKeywords && allPrimaryKeywords.length > 0) {
                mainKeywordResultDiv.innerHTML = generateKeywordCardHTML(allPrimaryKeywords[0]);
                if (allPrimaryKeywords.length > 1) {
                    recommendedKeywordsSection.classList.remove('hidden');
                    for (let i = 1; i < allPrimaryKeywords.length; i++) {
                        recommendedListDiv.innerHTML += generateKeywordCardHTML(allPrimaryKeywords[i]);
                    }
                } else {
                    recommendedKeywordsSection.classList.add('hidden'); 
                }

            } else {
                const noResults = document.createElement('p');
                noResults.textContent = 'No keywords found for this query.';
                resultsDiv.appendChild(noResults);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showError(`Failed to fetch SEO data: ${error.message}. Make sure your backend server is running and accessible.`);
        } finally {
            hideLoading(); 
        }
    });
    toggleRecommendedBtn.addEventListener('click', () => {
        if (recommendedListDiv.classList.contains('hidden')) {
            recommendedListDiv.classList.remove('hidden');
            toggleRecommendedBtn.textContent = 'Hide Recommended Keywords';
        } else {
            recommendedListDiv.classList.add('hidden');
            toggleRecommendedBtn.textContent = 'Show Recommended Keywords';
        }
    });
});
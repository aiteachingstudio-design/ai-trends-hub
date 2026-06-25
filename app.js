/**
 * PromptPulse - Core Application Logic
 * SPA Navigation, State Management, LocalStorage Sync, UI Rendering, and AI Sandbox Simulator
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. Core State Management
  // ==========================================================================
  
  let promptsState = [];
  let newsState = [];
  let blogsState = [];
  
  // Track upvoted prompt IDs
  let upvotedPrompts = JSON.parse(localStorage.getItem("promptpulse_upvoted_ids")) || [];
  
  // Active playground prompt & messages
  let activePlaygroundPrompt = null;
  let chatSimulated = false;

  // Initialize data from window.PromptPulseData (seeded in data.js)
  function initData() {
    // Load prompts (Merge seed data + localStorage custom submissions)
    const seedPrompts = window.PromptPulseData?.initialPrompts || [];
    const localPrompts = JSON.parse(localStorage.getItem("promptpulse_custom_prompts")) || [];
    promptsState = [...localPrompts, ...seedPrompts];

    // Load news (Merge seed data + localStorage custom submissions)
    const seedNews = window.PromptPulseData?.initialNews || [];
    const localNews = JSON.parse(localStorage.getItem("promptpulse_custom_news")) || [];
    newsState = [...localNews, ...seedNews];

    // Load blogs (read-only in this version)
    blogsState = window.PromptPulseData?.initialBlogs || [];

    // Sync state to UI stats indicators
    updateStatsCounters();
  }

  function updateStatsCounters() {
    const promptsCountEl = document.getElementById("stat-prompts-count");
    const newsCountEl = document.getElementById("stat-news-count");
    if (promptsCountEl) promptsCountEl.textContent = `${promptsState.length}+`;
    if (newsCountEl) newsCountEl.textContent = newsState.length;
  }

  // ==========================================================================
  // 2. SPA Router & Tab Control
  // ==========================================================================

  const sections = document.querySelectorAll(".app-section");
  const navLinks = document.querySelectorAll(".nav-link, .mobile-link, .footer-nav-link");

  function navigateTo(targetId) {
    // Hide all sections
    sections.forEach(sec => sec.classList.remove("active"));
    
    // Show target section
    const targetSection = document.getElementById(`sec-${targetId}`);
    if (targetSection) {
      targetSection.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update active state in nav elements
    navLinks.forEach(link => {
      if (link.getAttribute("data-target") === targetId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Mobile nav drawer auto close
    const mobileNav = document.getElementById("mobile-nav");
    if (mobileNav) mobileNav.classList.remove("open");

    // Perform section-specific render updates
    if (targetId === "home") {
      renderDashboard();
    } else if (targetId === "prompts") {
      renderPrompts();
    } else if (targetId === "news") {
      renderNews();
    } else if (targetId === "blogs") {
      renderBlogs();
    }
  }

  // Bind navigation links
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      if (target) {
        navigateTo(target);
        // Update URL hash without jumping
        history.pushState(null, null, `#${target}`);
      }
    });
  });

  // Handle logo click to home
  const logoBtn = document.getElementById("nav-logo");
  if (logoBtn) {
    logoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("home");
      history.pushState(null, null, "#home");
    });
  }

  // Watch URL hash changes (for back/forward navigation support)
  window.addEventListener("popstate", () => {
    const hash = window.location.hash.substring(1) || "home";
    navigateTo(hash);
  });

  // Initial Router Load
  const initialHash = window.location.hash.substring(1) || "home";
  initData();
  navigateTo(initialHash);

  // ==========================================================================
  // 3. UI Rendering Engine
  // ==========================================================================

  // Dashboard (Home) View
  function renderDashboard() {
    const homePromptsList = document.getElementById("home-prompts-list");
    const homeNewsList = document.getElementById("home-news-list");
    const featuredBlogContainer = document.getElementById("featured-blog-container");

    // 1. Render Top 2 Prompts (sorted by upvotes)
    if (homePromptsList) {
      const topPrompts = [...promptsState].sort((a, b) => b.upvotes - a.upvotes).slice(0, 2);
      homePromptsList.innerHTML = topPrompts.map(prompt => {
        const isUpvoted = upvotedPrompts.includes(prompt.id);
        const diffBadge = getDifficultyBadgeClass(prompt.difficulty);
        return `
          <div class="list-item-prompt" data-id="${prompt.id}">
            <div class="list-item-details">
              <div class="list-item-meta">
                <span class="badge ${diffBadge}">${prompt.difficulty}</span>
                <span class="badge badge-cyan">${prompt.category}</span>
              </div>
              <div class="list-item-title">${prompt.title}</div>
              <div class="list-item-desc">${prompt.description}</div>
            </div>
            <div class="list-item-actions">
              <button class="circle-btn prompt-action-copy" title="Copy Prompt" data-id="${prompt.id}">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button class="circle-btn prompt-action-play" title="Open in Playground" data-id="${prompt.id}">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");

      // Bind actions
      bindPromptCardEvents(homePromptsList);
    }

    // 2. Render 2 Latest News Items
    if (homeNewsList) {
      const latestNews = [...newsState].slice(0, 2);
      homeNewsList.innerHTML = latestNews.map(news => {
        return `
          <div class="list-item-news news-card-trigger" data-id="${news.id}">
            <img src="${news.image}" alt="${news.title}" class="news-thumb">
            <div class="news-text">
              <div class="news-meta">
                <span><i class="fa-solid fa-hashtag text-violet"></i> ${news.category}</span>
                <span>•</span>
                <span>${news.date}</span>
              </div>
              <div class="news-title-short">${news.title}</div>
            </div>
          </div>
        `;
      }).join("");

      // Bind click trigger to redirect to News tab
      homeNewsList.querySelectorAll(".news-card-trigger").forEach(card => {
        card.addEventListener("click", () => {
          navigateTo("news");
          history.pushState(null, null, "#news");
        });
      });
    }

    // 3. Render Featured Blog Article (first item)
    if (featuredBlogContainer && blogsState.length > 0) {
      const featured = blogsState[0];
      featuredBlogContainer.innerHTML = `
        <h2 class="section-title">Featured Developer Blog</h2>
        <div class="featured-blog-card">
          <div class="featured-blog-grid">
            <div class="featured-blog-content">
              <div class="featured-label"><i class="fa-solid fa-crown"></i> Staff Pick</div>
              <h3 class="featured-title">${featured.title}</h3>
              <p class="featured-excerpt">${featured.excerpt}</p>
              <div class="featured-meta">
                <span>By ${featured.author}</span>
                <span>•</span>
                <span>${featured.date}</span>
                <span>•</span>
                <span>${featured.readTime}</span>
              </div>
              <button class="btn btn-primary blog-read-btn" data-id="${featured.id}">
                Read Deep Dive <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
            <div class="featured-img-container">
              <img src="${featured.image}" alt="${featured.title}" class="featured-img">
              <div class="glass-overlay"></div>
            </div>
          </div>
        </div>
      `;

      // Bind blog reader open
      featuredBlogContainer.querySelector(".blog-read-btn").addEventListener("click", (e) => {
        const id = e.target.closest(".blog-read-btn").getAttribute("data-id");
        openBlogReader(id);
      });
    }
  }

  // Prompts Library View
  function renderPrompts() {
    const gridContainer = document.getElementById("prompts-grid-container");
    if (!gridContainer) return;

    const catFilter = document.getElementById("filter-category").value;
    const diffFilter = document.getElementById("filter-difficulty").value;
    const searchQuery = document.getElementById("prompts-search").value.toLowerCase();

    // Filter local state
    const filtered = promptsState.filter(prompt => {
      const matchesCat = catFilter === "all" || prompt.category === catFilter;
      const matchesDiff = diffFilter === "all" || prompt.difficulty === diffFilter;
      const matchesSearch = prompt.title.toLowerCase().includes(searchQuery) ||
                            prompt.description.toLowerCase().includes(searchQuery) ||
                            prompt.content.toLowerCase().includes(searchQuery);
      return matchesCat && matchesDiff && matchesSearch;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="no-results container">
          <i class="fa-solid fa-circle-question"></i>
          <h3>No Prompts Found</h3>
          <p>Try refining your search terms or adjusting filters.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(prompt => {
      const isUpvoted = upvotedPrompts.includes(prompt.id);
      const diffBadge = getDifficultyBadgeClass(prompt.difficulty);
      const activeVotedClass = isUpvoted ? "voted" : "";
      
      return `
        <div class="prompt-card" data-id="${prompt.id}">
          <div class="prompt-card-header">
            <span class="badge ${diffBadge}">${prompt.difficulty}</span>
            <span class="badge badge-cyan">${prompt.category}</span>
          </div>
          <h3 class="prompt-card-title">${prompt.title}</h3>
          <p class="prompt-card-desc">${prompt.description}</p>
          <div class="prompt-card-actions">
            <button class="upvote-btn prompt-action-upvote ${activeVotedClass}" data-id="${prompt.id}">
              <i class="fa-solid fa-circle-up"></i> 
              <span class="upvote-count">${prompt.upvotes}</span>
            </button>
            <div class="prompt-card-buttons">
              <button class="btn btn-secondary btn-icon prompt-action-copy" title="Copy Prompt" data-id="${prompt.id}">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button class="btn btn-primary prompt-action-play" data-id="${prompt.id}">
                Test <i class="fa-solid fa-play"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bindPromptCardEvents(gridContainer);
  }

  // Daily News Grid View
  function renderNews(selectedCategory = "all") {
    const gridContainer = document.getElementById("news-grid-container");
    if (!gridContainer) return;

    const filtered = newsState.filter(news => {
      return selectedCategory === "all" || news.category === selectedCategory;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="no-results container">
          <i class="fa-solid fa-newspaper"></i>
          <h3>No News Available</h3>
          <p>No recent news found for this category.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(news => {
      return `
        <div class="news-card">
          <div class="news-img-wrapper">
            <img src="${news.image}" alt="${news.title}" class="news-card-img">
            <div class="glass-overlay"></div>
          </div>
          <div class="news-card-body">
            <div class="news-card-meta">
              <span class="badge badge-violet"><i class="fa-solid fa-bolt"></i> ${news.category}</span>
              <span class="news-card-date">${news.date}</span>
            </div>
            <h3 class="news-card-title">${news.title}</h3>
            <p class="news-card-summary">${news.summary}</p>
            <div class="news-card-footer">
              <span class="news-card-source"><i class="fa-solid fa-globe"></i> ${news.source}</span>
              <span class="badge">${news.readTime}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Blogs Grid View
  function renderBlogs() {
    const gridContainer = document.getElementById("blogs-grid-container");
    if (!gridContainer) return;

    gridContainer.innerHTML = blogsState.map(blog => {
      return `
        <div class="blog-card">
          <div class="blog-img-wrapper">
            <img src="${blog.image}" alt="${blog.title}" class="blog-card-img">
            <div class="glass-overlay"></div>
          </div>
          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span><i class="fa-solid fa-user-pen"></i> ${blog.author}</span>
              <span>•</span>
              <span>${blog.readTime}</span>
            </div>
            <h3 class="blog-card-title">${blog.title}</h3>
            <p class="blog-card-excerpt">${blog.excerpt}</p>
            <div class="blog-card-footer">
              <button class="btn btn-secondary blog-read-btn" data-id="${blog.id}">
                Read Post <i class="fa-solid fa-book-open"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Bind triggers
    gridContainer.querySelectorAll(".blog-read-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest(".blog-read-btn").getAttribute("data-id");
        openBlogReader(id);
      });
    });
  }

  // Helper mapping difficulty colors
  function getDifficultyBadgeClass(diff) {
    if (diff === "Advanced") return "badge-amber";
    if (diff === "Intermediate") return "badge-violet";
    return "badge-cyan";
  }

  // Bind dynamic click events for Prompt cards (Upvote, Copy, Play)
  function bindPromptCardEvents(containerElement) {
    // Copy button handler
    containerElement.querySelectorAll(".prompt-action-copy").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const prompt = promptsState.find(p => p.id === id);
        if (prompt) {
          copyTextToClipboard(prompt.content);
        }
      });
    });

    // Play/Test button handler
    containerElement.querySelectorAll(".prompt-action-play").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        openPlayground(id);
      });
    });

    // Upvote handler
    containerElement.querySelectorAll(".prompt-action-upvote").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        handleUpvote(id, btn);
      });
    });
  }

  // ==========================================================================
  // 4. Interactive Operations (Upvoting, Copying, Newsletter)
  // ==========================================================================

  // Upvote logic
  function handleUpvote(id, element) {
    const prompt = promptsState.find(p => p.id === id);
    if (!prompt) return;

    const isVoted = upvotedPrompts.includes(id);

    if (isVoted) {
      // Remove Upvote
      prompt.upvotes--;
      upvotedPrompts = upvotedPrompts.filter(vid => vid !== id);
      element.classList.remove("voted");
    } else {
      // Add Upvote
      prompt.upvotes++;
      upvotedPrompts.push(id);
      element.classList.add("voted");
      showToastNotification("Upvoted! Thank you for voting.");
    }

    // Save voted array to local storage
    localStorage.setItem("promptpulse_upvoted_ids", JSON.stringify(upvotedPrompts));
    
    // Sync to custom prompts in storage if it is a user submitted prompt
    const localPrompts = JSON.parse(localStorage.getItem("promptpulse_custom_prompts")) || [];
    const localPromptIdx = localPrompts.findIndex(p => p.id === id);
    if (localPromptIdx !== -1) {
      localPrompts[localPromptIdx].upvotes = prompt.upvotes;
      localStorage.setItem("promptpulse_custom_prompts", JSON.stringify(localPrompts));
    }

    // Render upvote counter update
    const counter = element.querySelector(".upvote-count");
    if (counter) counter.textContent = prompt.upvotes;

    // Sync stats counters
    updateStatsCounters();
  }

  // Clipboard copy
  function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToastNotification("Prompt instructions copied to clipboard!");
    }).catch(err => {
      console.error("Could not copy text: ", err);
      // Fallback alert
      showToastNotification("Failed to copy automatically.");
    });
  }

  // Show customized modern overlay toast
  function showToastNotification(message) {
    const toast = document.getElementById("toast-notif");
    const toastMsg = document.getElementById("toast-notif-message");
    
    if (toast && toastMsg) {
      toastMsg.textContent = message;
      toast.classList.add("show");
      
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3500);
    }
  }

  // Newsletter Submit
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletter-email").value;
      showToastNotification(`Success! ${email} has subscribed to the Daily Pulse.`);
      newsletterForm.reset();
    });
  }

  // Redirect hero search input to prompts tab
  const heroSearchInput = document.getElementById("hero-search-input");
  const heroSearchBtn = document.getElementById("hero-search-btn");
  
  function executeHeroSearch() {
    if (!heroSearchInput) return;
    const value = heroSearchInput.value.trim();
    if (value.length > 0) {
      // Set prompts filter input
      const promptsSearch = document.getElementById("prompts-search");
      if (promptsSearch) {
        promptsSearch.value = value;
      }
      // Navigate
      navigateTo("prompts");
      history.pushState(null, null, "#prompts");
      // Reset input
      heroSearchInput.value = "";
    }
  }

  if (heroSearchBtn) {
    heroSearchBtn.addEventListener("click", executeHeroSearch);
  }
  if (heroSearchInput) {
    heroSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") executeHeroSearch();
    });
  }

  // ==========================================================================
  // 5. Submit Portal Forms Logic
  // ==========================================================================

  const tabSubmitPrompt = document.getElementById("tab-submit-prompt");
  const tabSubmitNews = document.getElementById("tab-submit-news");
  const formSubmitPrompt = document.getElementById("form-submit-prompt");
  const formSubmitNews = document.getElementById("form-submit-news");

  // Toggle Submission Tabs
  if (tabSubmitPrompt && tabSubmitNews) {
    tabSubmitPrompt.addEventListener("click", () => {
      tabSubmitPrompt.classList.add("active");
      tabSubmitNews.classList.remove("active");
      formSubmitPrompt.classList.add("active");
      formSubmitNews.classList.remove("active");
    });

    tabSubmitNews.addEventListener("click", () => {
      tabSubmitNews.classList.add("active");
      tabSubmitPrompt.classList.remove("active");
      formSubmitNews.classList.add("active");
      formSubmitPrompt.classList.remove("active");
    });
  }

  // Prompt Form submit handler
  if (formSubmitPrompt) {
    formSubmitPrompt.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newPrompt = {
        id: `custom-prompt-${Date.now()}`,
        title: document.getElementById("prompt-title").value,
        category: document.getElementById("prompt-category").value,
        difficulty: document.getElementById("prompt-difficulty").value,
        description: document.getElementById("prompt-desc").value,
        content: document.getElementById("prompt-content").value,
        upvotes: 1,
        responses: [
          {
            sender: "user",
            text: document.getElementById("prompt-resp-user").value
          },
          {
            sender: "ai",
            text: document.getElementById("prompt-resp-ai").value
          }
        ]
      };

      // Save to localStorage list
      const customPrompts = JSON.parse(localStorage.getItem("promptpulse_custom_prompts")) || [];
      customPrompts.unshift(newPrompt);
      localStorage.setItem("promptpulse_custom_prompts", JSON.stringify(customPrompts));

      // Refresh State & UI
      initData();
      formSubmitPrompt.reset();
      showToastNotification("Your prompt has been published successfully!");
      
      // Redirect to prompts page
      navigateTo("prompts");
      history.pushState(null, null, "#prompts");
    });
  }

  // News Form submit handler
  if (formSubmitNews) {
    formSubmitNews.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newNews = {
        id: `custom-news-${Date.now()}`,
        title: document.getElementById("news-title").value,
        summary: document.getElementById("news-summary").value,
        source: document.getElementById("news-source").value,
        date: "Today",
        readTime: "2 min read",
        image: "assets/news_ai_robot.png", // default
        category: document.getElementById("news-category").value
      };

      // Save to localStorage list
      const customNews = JSON.parse(localStorage.getItem("promptpulse_custom_news")) || [];
      customNews.unshift(newNews);
      localStorage.setItem("promptpulse_custom_news", JSON.stringify(customNews));

      // Refresh State & UI
      initData();
      formSubmitNews.reset();
      showToastNotification("Your news article has been published successfully!");
      
      // Redirect to news page
      navigateTo("news");
      history.pushState(null, null, "#news");
    });
  }

  // ==========================================================================
  // 6. Detailed Blog Article Reader Modal
  // ==========================================================================

  const blogReaderModal = document.getElementById("blog-reader-modal");
  const blogReaderCloseBtn = document.getElementById("blog-reader-close-btn");

  function openBlogReader(id) {
    const blog = blogsState.find(b => b.id === id);
    if (!blog || !blogReaderModal) return;

    // Set content details
    document.getElementById("blog-header-img").style.backgroundImage = `url('${blog.image}')`;
    document.getElementById("blog-author-display").innerHTML = `<i class="fa-solid fa-user-pen"></i> By ${blog.author}`;
    document.getElementById("blog-date-display").innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${blog.date}`;
    document.getElementById("blog-time-display").innerHTML = `<i class="fa-solid fa-clock"></i> ${blog.readTime}`;
    document.getElementById("blog-title-display").textContent = blog.title;
    document.getElementById("blog-content-display").innerHTML = blog.content;

    // Show modal
    blogReaderModal.classList.add("open");
    document.body.style.overflow = "hidden"; // disable body scrolling
  }

  function closeBlogReader() {
    if (blogReaderModal) {
      blogReaderModal.classList.remove("open");
      document.body.style.overflow = ""; // restore body scrolling
    }
  }

  if (blogReaderCloseBtn) {
    blogReaderCloseBtn.addEventListener("click", closeBlogReader);
  }

  // Close reader on overlay click outside content bounds
  if (blogReaderModal) {
    blogReaderModal.addEventListener("click", (e) => {
      if (e.target === blogReaderModal) {
        closeBlogReader();
      }
    });
  }

  // ==========================================================================
  // 7. Prompt Playground Simulator Drawer
  // ==========================================================================

  const playgroundDrawer = document.getElementById("playground-drawer");
  const playgroundCloseBtn = document.getElementById("playground-close-btn");
  const playgroundPromptBody = document.getElementById("playground-prompt-body");
  const playgroundSubtitle = document.getElementById("playground-subtitle");
  const playgroundChatMessages = document.getElementById("playground-chat-messages");
  const playgroundSimulateBtn = document.getElementById("playground-simulate-btn");
  const playgroundCopyBtn = document.getElementById("playground-copy-btn");
  const playgroundCopiedToast = document.getElementById("playground-copied-toast");
  const playgroundChatInput = document.getElementById("playground-chat-input");

  function openPlayground(id) {
    const prompt = promptsState.find(p => p.id === id);
    if (!prompt || !playgroundDrawer) return;

    activePlaygroundPrompt = prompt;
    chatSimulated = false;

    // Load static contents
    playgroundSubtitle.textContent = `Testing: ${prompt.title}`;
    playgroundPromptBody.textContent = prompt.content;

    // Reset Chat panel
    playgroundChatMessages.innerHTML = `
      <div class="chat-bubble ai">
        <span class="bubble-sender">System</span>
        <div class="bubble-content">Sandbox workspace initialized. Click the <strong>Simulate Prompt</strong> button below to see how this structured AI template executes inside the LLM container environment.</div>
      </div>
    `;

    // Reset simulator inputs
    playgroundChatInput.value = "";
    playgroundSimulateBtn.disabled = false;
    playgroundSimulateBtn.innerHTML = `Simulate Prompt <i class="fa-solid fa-wand-magic-sparkles"></i>`;

    // Slide open drawer
    playgroundDrawer.classList.add("open");
  }

  function closePlayground() {
    if (playgroundDrawer) {
      playgroundDrawer.classList.remove("open");
    }
  }

  if (playgroundCloseBtn) {
    playgroundCloseBtn.addEventListener("click", closePlayground);
  }

  // Copy prompt inside playground drawer
  if (playgroundCopyBtn) {
    playgroundCopyBtn.addEventListener("click", () => {
      if (activePlaygroundPrompt) {
        navigator.clipboard.writeText(activePlaygroundPrompt.content).then(() => {
          // Show drawer-specific success message
          if (playgroundCopiedToast) {
            playgroundCopiedToast.style.display = "inline-flex";
            setTimeout(() => {
              playgroundCopiedToast.style.display = "none";
            }, 2500);
          }
        });
      }
    });
  }

  // Trigger simulated conversation flow
  if (playgroundSimulateBtn) {
    playgroundSimulateBtn.addEventListener("click", () => {
      if (!activePlaygroundPrompt || chatSimulated) return;

      chatSimulated = true;
      playgroundSimulateBtn.disabled = true;
      
      const responses = activePlaygroundPrompt.responses || [];
      const userTurn = responses[0] || { sender: "user", text: "Test sample query." };
      const aiTurn = responses[1] || { sender: "ai", text: "I have simulated the result successfully." };

      // 1. Render User message bubble
      appendChatBubble(userTurn.sender, userTurn.text);
      
      // Disable action buttons during simulation typing
      playgroundSimulateBtn.innerHTML = `<i class="fa-solid fa-cog fa-spin"></i> Processing...`;

      // 2. Delay AI response and then simulate typing stream
      setTimeout(() => {
        // Append AI container with empty message
        const chatMessages = document.getElementById("playground-chat-messages");
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble ai";
        bubble.innerHTML = `
          <span class="bubble-sender">${aiTurn.sender.toUpperCase()} Response</span>
          <div class="bubble-content" id="typing-bubble-target"></div>
        `;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Perform dynamic typewriting effect
        const target = document.getElementById("typing-bubble-target");
        let rawContent = aiTurn.text;
        
        // Parse markdown code blocks in text to simple format if needed, 
        // but let's write it character by character or word by word
        const words = rawContent.split(" ");
        let wordIndex = 0;
        
        const timer = setInterval(() => {
          if (wordIndex < words.length) {
            target.innerHTML = words.slice(0, wordIndex + 1).join(" ") + " █";
            wordIndex++;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } else {
            // Finished
            clearInterval(timer);
            // Replace final output without cursor indicator and format blocks
            target.innerHTML = formatAIResponseText(rawContent);
            playgroundSimulateBtn.innerHTML = `<i class="fa-solid fa-check"></i> Simulation Finished`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        }, 40); // speed controls word-by-word flow

      }, 1200); // 1.2s delay simulating server execution latency
    });
  }

  function appendChatBubble(sender, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = `
      <span class="bubble-sender">${sender.toUpperCase()}</span>
      <div class="bubble-content">${text}</div>
    `;
    playgroundChatMessages.appendChild(bubble);
    playgroundChatMessages.scrollTop = playgroundChatMessages.scrollHeight;
  }

  // Simple formatting helper for markdown backticks inside responses
  function formatAIResponseText(text) {
    // Escape standard HTML tags
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace code blocks: ```lang ... ```
    formatted = formatted.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Replace inline code elements: `code`
    formatted = formatted.replace(/`(.*?)`/g, "<code>$1</code>");

    // Highlight bullet list lines (starts with - or number)
    formatted = formatted.replace(/^\s*([0-9]+\.\s|\*\s|-\s)(.*?)$/gm, "<li>$2</li>");
    formatted = formatted.replace(/(<li>.*?<\/li>)+/g, "<ul>$&</ul>");

    return formatted;
  }

  // ==========================================================================
  // 8. Filters & Search Page Interactions
  // ==========================================================================

  // Prompts filter triggers
  const promptSearchEl = document.getElementById("prompts-search");
  const filterCatEl = document.getElementById("filter-category");
  const filterDiffEl = document.getElementById("filter-difficulty");

  if (promptSearchEl) {
    promptSearchEl.addEventListener("input", renderPrompts);
  }
  if (filterCatEl) {
    filterCatEl.addEventListener("change", renderPrompts);
  }
  if (filterDiffEl) {
    filterDiffEl.addEventListener("change", renderPrompts);
  }

  // News topic category chips triggers
  const newsCategoryFilters = document.getElementById("news-category-filters");
  if (newsCategoryFilters) {
    const chips = newsCategoryFilters.querySelectorAll(".topic-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        // Toggle Active Class
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        
        // Filter and Render
        const selectedCat = chip.getAttribute("data-cat");
        renderNews(selectedCat);
      });
    });
  }

  // Prompts and News view-all navigation hooks from homepage
  document.querySelectorAll(".view-all-prompts").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("prompts");
      history.pushState(null, null, "#prompts");
    });
  });

  document.querySelectorAll(".view-all-news").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("news");
      history.pushState(null, null, "#news");
    });
  });

  // Mobile menu open / close toggle triggers
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileNavClose = document.getElementById("mobile-nav-close");
  
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.add("open");
    });
  }

  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });
  }
});

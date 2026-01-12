(function() {
  if (document.getElementById('excalidraw-sidebar')) return;

  const SIDEBAR_OPEN_KEY = 'excalidraw-sidebar-open';
  const SEARCH_QUERY_KEY = 'excalidraw-sidebar-search';
  
  const isSidebarOpen = sessionStorage.getItem(SIDEBAR_OPEN_KEY) === 'true';
  const savedSearch = sessionStorage.getItem(SEARCH_QUERY_KEY) || '';

  // 1. CSS Styles
  const style = document.createElement('style');
  style.id = 'sidebar-style';
  style.textContent = `
    #excalidraw-sidebar {
      position: fixed; right: 0; top: 0; bottom: 0; width: 340px;
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px);
      border-left: 1px solid #e2e8f0; z-index: 99999;
      display: flex; flex-direction: column; overflow: visible;
      box-shadow: -10px 0 30px rgba(0,0,0,0.03);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #excalidraw-sidebar.animate {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #excalidraw-sidebar.translate-x-full { transform: translateX(100%); }
    #excalidraw-sidebar.translate-x-0 { transform: translateX(0); }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    #excalidraw-sidebar.ready { transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    
    /* Toast Styles */
    #sidebar-toast-container {
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      z-index: 1000000; display: flex; flex-direction: column; gap: 8px;
    }
    .status-toast {
      padding: 12px 24px; background: #1e293b; color: white; border-radius: 14px;
      font-size: 13px; font-weight: 500; shadow: 0 10px 20px rgba(0,0,0,0.2);
      animation: toast-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1);
    }
    @keyframes toast-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // 2. Toast Container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'sidebar-toast-container';
  document.body.appendChild(toastContainer);

  window.showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = 'status-toast';
    const icon = type === 'success' ? 'check-circle' : 'info';
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${type === 'success' ? 'text-emerald-400' : 'text-blue-400'}"></i><span>${msg}</span>`;
    toastContainer.appendChild(toast);
    if(window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s, transform 0.5s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  // 3. Sidebar Structure
  const sidebar = document.createElement('div');
  sidebar.id = 'excalidraw-sidebar';
  sidebar.className = isSidebarOpen ? 'translate-x-0' : 'translate-x-full';
  
  sidebar.innerHTML = `
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
        <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        Workspace
      </h3>
      <div class="flex gap-1 text-slate-400">
        <button id="open-folder-btn" class="p-2 hover:bg-slate-50 hover:text-indigo-500 rounded-lg transition-colors"><i data-lucide="folder-open" class="w-4 h-4"></i></button>
        <button id="refresh-files" class="p-2 hover:bg-slate-50 hover:text-indigo-500 rounded-lg transition-colors"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
      </div>
    </div>
    <div class="p-4">
      <div class="relative">
        <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-slate-300"></i>
        <input type="text" id="file-search" placeholder="Search drawings..." 
          class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-100 transition-all">
      </div>
    </div>
    <div id="file-list" class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"></div>
    <div id="sidebar-toggle" class="absolute left-[-42px] top-32 w-11 h-12 bg-white border border-slate-200 border-r-0 rounded-l-xl shadow-md flex items-center justify-center cursor-pointer hover:bg-white group transition-colors">
      <i data-lucide="${isSidebarOpen ? 'panel-right-close' : 'panel-right-open'}" class="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all"></i>
    </div>
  `;

  // Inject dependencies
  const tw = document.createElement('script');
  tw.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(tw);

  const lc = document.createElement('script');
  lc.src = 'https://unpkg.com/lucide@latest';
  lc.onload = () => lucide.createIcons();
  document.head.appendChild(lc);

  document.body.appendChild(sidebar);
  
  const searchInput = document.getElementById('file-search');
  searchInput.value = savedSearch;

  // Key: Enable animation after a safe delay
  setTimeout(() => {
    sidebar.classList.add('ready');
  }, 300);

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      triggerManualSave();
    }
  });

  async function triggerManualSave() {
    const el = localStorage.getItem('excalidraw');
    const stStr = localStorage.getItem('excalidraw-state') || '{}';
    if (el) {
      const st = JSON.parse(stStr);
      let name = st.name || 'untitled';
      // Remove [auto] prefix if manually saving
      if (name.startsWith('[auto]')) {
        name = name.replace('[auto]', '');
      }
      const out = {
        type: 'excalidraw', version: 2, source: 'https://excalidraw.com',
        elements: JSON.parse(el), appState: st
      };
      window.electronAPI.saveFile(name, JSON.stringify(out));
      showToast(`Saved "${name}" to local workspace`);
      fetchFiles();
    }
  }

  // --- Functions ---
  window.fetchFiles = async function() {
    const files = await window.electronAPI.listFiles();
    render(files);
  }

  function render(files) {
    const q = searchInput.value.toLowerCase();
    const list = document.getElementById('file-list');
    list.innerHTML = '';

    files.filter(f => f.name.toLowerCase().includes(q))
      .sort((a, b) => b.mtime - a.mtime)
      .forEach(f => {
        const item = document.createElement('div');
        item.className = 'group p-3 bg-white border border-slate-50 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all cursor-pointer flex items-center gap-2';
        
        const iconBox = document.createElement('div');
        iconBox.className = 'w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all';
        iconBox.innerHTML = '<i data-lucide="file" class="w-4 h-4"></i>';

        const mainInfo = document.createElement('div');
        mainInfo.className = 'flex-1 min-w-0';
        const nameArea = document.createElement('div');
        nameArea.className = 'font-bold text-slate-700 text-[13px] truncate mb-0.5';
        nameArea.textContent = f.name.replace('.excalidraw', '');
        
        const meta = document.createElement('div');
        meta.className = 'text-[10px] text-slate-400 whitespace-nowrap tracking-tight';
        const date = new Date(f.mtime);
        const dateStr = date.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
        const timeStr = date.toLocaleString('en-US', {
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        });
        meta.textContent = `${dateStr} · ${timeStr}`;
        mainInfo.append(nameArea, meta);
        
        mainInfo.onclick = () => window.electronAPI.openFile(f.name);

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-all';
        
        const renBtn = document.createElement('button');
        renBtn.className = 'p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-500';
        renBtn.innerHTML = '<i data-lucide="pencil" class="w-3.5 h-3.5"></i>';
        renBtn.onclick = (e) => {
          e.stopPropagation();
          const cur = f.name.replace('.excalidraw', '');
          const inp = document.createElement('input');
          inp.value = cur;
          inp.className = 'w-full px-2 py-1 bg-white border border-indigo-400 rounded-lg text-sm focus:outline-none';
          nameArea.innerHTML = ''; nameArea.appendChild(inp);
          inp.focus(); inp.select();
          
          let done = false;
          const finish = async (s) => {
            if (done) return; done = true;
            const next = inp.value.trim();
            if (s && next && next !== cur) {
              const ok = await window.electronAPI.renameFile(f.name, next);
              if (ok) {
                const st = JSON.parse(localStorage.getItem('excalidraw-state') || '{}');
                st.name = next;
                localStorage.setItem('excalidraw-state', JSON.stringify(st));
                showToast(`Renamed to "${next}"`);
                location.reload(); return;
              }
            }
            fetchFiles();
          };
          inp.onkeydown = (ev) => { if(ev.key === 'Enter') finish(true); if(ev.key === 'Escape') finish(false); };
          inp.onblur = () => finish(true);
          inp.onclick = (ev) => ev.stopPropagation();
        };

        const copyBtn = document.createElement('button');
        copyBtn.className = 'p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-500';
        copyBtn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
        copyBtn.onclick = (e) => {
          e.stopPropagation();
          window.electronAPI.copyFile(f.name).then(ok => { 
            if(ok) {
              showToast('File duplicated');
              fetchFiles();
            }
          });
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500';
        delBtn.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          window.electronAPI.deleteFile(f.name).then(ok => { 
            if(ok) {
              showToast('File deleted', 'info');
              fetchFiles(); 
            }
          });
        };

        actions.append(renBtn, copyBtn, delBtn);
        item.append(iconBox, mainInfo, actions);
        list.appendChild(item);
      });
    if(window.lucide) lucide.createIcons();
  }

  // Interceptor
  window.showSaveFilePicker = async (options) => {
    const suggestedName = options.suggestedName || 'untitled';
    await triggerManualSave();
    return { createWritable: async () => ({ write: async () => {}, close: async () => {} }) };
  };

  const toggle = document.getElementById('sidebar-toggle');
  toggle.onclick = () => {
    const isNowOpen = sidebar.classList.contains('translate-x-full');
    if (isNowOpen) {
      sidebar.classList.replace('translate-x-full', 'translate-x-0');
    } else {
      sidebar.classList.replace('translate-x-0', 'translate-x-full');
    }
    sessionStorage.setItem(SIDEBAR_OPEN_KEY, isNowOpen);
    const icon = toggle.querySelector('i');
    icon.setAttribute('data-lucide', isNowOpen ? 'panel-right-close' : 'panel-right-open');
    if(window.lucide) lucide.createIcons();
  };

  searchInput.oninput = (e) => {
    sessionStorage.setItem(SEARCH_QUERY_KEY, e.target.value);
    fetchFiles();
  };

  document.getElementById('refresh-files').onclick = () => fetchFiles();
  document.getElementById('open-folder-btn').onclick = () => window.electronAPI.openFinder();
  window.electronAPI.onRefreshSidebar(() => fetchFiles());
  
  window.electronAPI.loadFile(dStr => {
    try {
      const d = JSON.parse(dStr);
      localStorage.setItem('excalidraw', JSON.stringify(d.elements));
      localStorage.setItem('excalidraw-state', JSON.stringify(d.appState || {}));
      location.reload();
    } catch(e) {}
  });

  window.electronAPI.onAutoSave(() => {
    const el = localStorage.getItem('excalidraw');
    const stStr = localStorage.getItem('excalidraw-state') || '{}';
    if (el) {
      const st = JSON.parse(stStr);
      let name = st.name || 'untitled';
      if (!name.startsWith('[auto]')) {
        name = '[auto]' + name;
      }
      const out = {
        type: 'excalidraw', version: 2, source: 'https://excalidraw.com',
        elements: JSON.parse(el), appState: st
      };
      window.electronAPI.saveFile(name, JSON.stringify(out));
      fetchFiles();
    }
  });

  fetchFiles();
})();

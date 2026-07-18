(() => {
  const STORAGE = { language: 'traceerase-language', theme: 'traceerase-theme' };

  const ru = {
    'control.light': 'Светлая', 'control.dark': 'Тёмная',
    'control.toEnglish': 'Переключить на английский', 'control.toRussian': 'Переключить на русский',
    'control.toLight': 'Включить светлую тему', 'control.toDark': 'Включить тёмную тему',
    'control.settings': 'Настройки интерфейса',
    'hero.cta': 'Увидеть свой след', 'hero.note': 'Без регистрации. Результаты появляются прямо на этой странице.',
    'cat.dev': 'разработка', 'cat.soc': 'соцсети', 'cat.blog': 'блоги', 'cat.media': 'медиа',
    'cat.work': 'работа', 'cat.game': 'игры', 'cat.link': 'ссылки', 'cat.risk': 'риск', 'cat.infra': 'инфраструктура',
    'state.found': 'след найден', 'state.free': 'чисто', 'state.unknown': 'проверь вручную',
    'kind.username': 'никнейм', 'kind.email': 'email', 'kind.domain': 'домен',
    'time.unit': 'с',
    'signal.initial': 'готов к проверке', 'signal.ready': '{count} источников готово', 'signal.detected': 'цель обнаружена', 'signal.none': 'не выбрана',
    'coverage.fallback': 'публичных источников',
    'report.request': 'Запрос', 'report.checkDelete': 'Проверь и удали', 'report.prepare': 'Подготовь запрос для',
    'report.open': 'открытый профиль', 'report.visible': 'заметный профиль', 'report.quiet': 'тихий профиль',
    'scan.again': 'Проверить ещё раз', 'scan.running': 'Сканирую…',
    'scan.wait': 'Идёт сканирование. Запросы уходят на реальные сайты — это занимает несколько секунд.',
    'scan.connection': 'Соединение потеряно. Попробуй ещё раз.',
    'scan.doneFound': 'Найдено {count} следов. Теперь у тебя есть карта и понятная точка старта.',
    'scan.doneEmpty': 'В проверенных публичных источниках совпадений не найдено.',
    'erase.start': 'потяни, чтобы собрать маршрут', 'erase.progress': 'маршрут собран на {value}%', 'erase.done': 'теперь всё перед глазами',
    'demo.title': 'demo-user · пример отчёта', 'demo.note': 'Демо не отправляет запросы во внешние источники.',
    'demo.publicRepos': 'публичные репозитории', 'demo.publicProfile': 'публичный профиль',
    'demo.oldMention': 'старое упоминание', 'demo.archive': 'Архивный профиль',
    'letter.copied': 'Скопировано ✓', 'letter.copy': 'Скопировать',
    'sources.all': 'все', 'sources.error': 'Не удалось загрузить список. Попробуй обновить страницу.'
  };

  const en = {
    'meta.home.title': 'TraceErase — see yourself through the internet’s eyes',
    'meta.home.description': 'TraceErase finds public profiles and turns your digital footprint into a clear action plan.',
    'meta.sources.title': 'TraceErase sources — where we look for digital traces',
    'meta.sources.description': 'The full list of public sources checked by TraceErase.',
    'control.light': 'Light', 'control.dark': 'Dark',
    'control.toEnglish': 'Switch to English', 'control.toRussian': 'Switch to Russian',
    'control.toLight': 'Switch to light theme', 'control.toDark': 'Switch to dark theme',
    'control.settings': 'Interface settings',
    'nav.why': 'Why', 'nav.scenarios': 'Scenarios', 'nav.how': 'How it works', 'nav.result': 'What you get',
    'nav.sources': 'Sources', 'nav.scan': 'Check yourself', 'nav.home': 'Home',
    'hero.sources': 'public sources', 'hero.oneName': 'one identity', 'hero.oneMap': 'one map',
    'hero.w1': 'See', 'hero.w2': 'yourself', 'hero.w3': 'the way', 'hero.w4': 'the internet', 'hero.w5': 'does',
    'hero.lead': 'TraceErase gathers scattered public profiles into one map — so you can see your digital footprint and decide what stays and what goes.',
    'hero.inputLabel': 'Username, email, or domain', 'hero.inputPlaceholder': 'enter a username, email, or domain',
    'hero.cta': 'See my footprint', 'hero.note': 'No sign-up. Results appear right on this page.', 'hero.demo': 'View a sample report',
    'hero.mapAria': 'Example TraceErase source map', 'hero.mapLive': 'public view / live', 'hero.target': 'target',
    'hero.profiles': 'profiles', 'hero.media': 'media', 'hero.work': 'work', 'hero.games': 'games',
    'hero.outcomesAria': 'What TraceErase gives you', 'hero.find': 'find', 'hero.understand': 'understand', 'hero.control': 'take control',
    'value.kicker': 'Why it matters', 'value.title': 'Stop searching one site at a time.', 'value.titleAccent': 'See the whole picture.',
    'value.find': 'Find', 'value.findText': 'Old profiles and public pages that are easy to forget.',
    'value.understand': 'Understand', 'value.understandText': 'Which parts of your online history are visible to a stranger.',
    'value.act': 'Act', 'value.actText': 'Go straight to the source and start with the most visible traces.',
    'report.kicker': 'Report', 'report.scanning': 'Scanning…', 'report.progressAria': 'Scan progress',
    'report.found': 'traces found', 'report.clean': 'clear', 'report.unknown': 'needs review', 'report.time': 'elapsed',
    'report.traces': 'Traces', 'report.all': 'All', 'report.foundLead': 'Found', 'report.nextTitle': 'traces. What now?',
    'report.nextText': 'We turned the findings into a short route — start with the most visible one.', 'report.openRoute': 'Open the route →',
    'report.save': 'Save report', 'report.route': 'Cleanup route', 'report.start': 'Where to begin', 'report.visibility': 'visibility',
    'problem.kicker': 'When it matters', 'problem.title': 'The past resurfaces', 'problem.title2': 'without an invitation',
    'problem.lead': 'TraceErase helps when you want to decide which version of you remains public.',
    'moment.workTag': 'new job', 'moment.workTitle': 'Before an important introduction',
    'moment.workText': 'See the digital portrait built from old profiles and public pages.', 'moment.workAction': 'check your reputation trail →',
    'moment.publicTag': 'going public', 'moment.publicTitle': 'Before launching a project',
    'moment.publicText': 'Separate your personal history from your professional identity before attention grows.', 'moment.publicAction': 'map your profiles →',
    'moment.resetTag': 'new chapter', 'moment.resetTitle': 'When you want a fresh start',
    'moment.resetText': 'Find forgotten accounts and decide which ones should no longer represent you.', 'moment.resetAction': 'find old accounts →',
    'moment.awareTag': 'awareness', 'moment.awareTitle': 'Just to know',
    'moment.awareText': 'See yourself through a stranger’s eyes and take control before it becomes urgent.', 'moment.awareAction': 'check your visibility →',
    'coverage.kicker': 'Search map', 'coverage.title': 'Traces live in different corners of the internet',
    'coverage.lead': 'Each source is checked separately. The counters below come from the real TraceErase database.', 'coverage.all': 'View every source',
    'how.kicker': 'How it works', 'how.title': 'From one line', 'how.title2': 'to a clear picture',
    'how.lead': 'Three sequential steps. No tables you have to decode on your own.',
    'how.oneTitle': 'Choose a starting point', 'how.oneText': 'Enter a username, email, or domain — the same clue someone else could already use.',
    'how.twoTitle': 'TraceErase checks the sources', 'how.twoText': 'The scanner moves through public profiles and technical sources, showing progress live.',
    'how.threeTitle': 'You get an action route', 'how.threeText': 'Found pages, a visibility score, and direct next steps — from reviewing a profile to drafting a request.',
    'result.kicker': 'What you get', 'result.title': 'Not a promise to disappear.', 'result.title2': 'The power to choose.',
    'result.lead': 'Drag the slider: TraceErase turns scattered traces into a clear list of decisions.',
    'result.scattered': 'scattered', 'result.controlled': 'under control',
    'result.beforeTag': 'Before · digital noise', 'result.publicProfile': 'public profile', 'result.activity': 'activity history',
    'result.oldMention': 'old mention', 'result.manual': 'needs manual review', 'result.afterTag': 'After · action route',
    'result.check': '01 · review', 'result.checkText': 'what is visible in the old profile',
    'result.decide': '02 · decide', 'result.decideText': 'keep, hide, or delete the page',
    'result.open': '03 · open', 'result.openText': 'the found source directly',
    'result.prepare': '04 · prepare', 'result.prepareText': 'a draft data removal request',
    'result.choice': '// you decide what remains public', 'result.rangeAria': 'Show the action route for found traces',
    'result.map': 'Map', 'result.mapText': 'where you were found', 'result.score': 'Score', 'result.scoreText': 'how visible your profile is',
    'result.links': 'Links', 'result.linksText': 'where to go right now', 'result.route': 'Route', 'result.routeText': 'where to begin the cleanup',
    'mission.kicker': 'The TraceErase idea', 'mission.title': 'Privacy does not begin', 'mission.title2': 'with deletion.',
    'mission.title3': 'First, you need to see.', 'mission.text': 'We want checking your digital footprint to feel as ordinary as reviewing privacy settings: clear, accessible, and free from specialist knowledge.',
    'final.kicker': 'Your footprint · your rules', 'final.title': 'Discover what the internet', 'final.title2': 'remembers about you',
    'final.cta': 'Check yourself for free', 'final.note': 'One identity. Public sources. A clear result.',
    'footer.text': 'A digital awareness tool · works with publicly available pages',
    'dialog.title': 'Draft removal request', 'dialog.note': 'Review the text and the service’s requirements before sending.',
    'dialog.textAria': 'Request text', 'dialog.copy': 'Copy', 'dialog.mail': 'Open in email', 'dialog.close': 'Close',
    'sources.kicker': 'Transparency', 'sources.title': 'Where we look for', 'sources.title2': 'digital traces',
    'sources.lead': 'TraceErase only checks publicly available profiles and technical sources. This list updates with the engine.',
    'sources.total': 'sources covered', 'sources.filterAria': 'Source filter',
    'sources.note': 'If a service is unavailable or blocks automated requests, the report says “needs review” instead of returning a false result.',
    'control.light': 'Light', 'control.dark': 'Dark',
    'cat.dev': 'development', 'cat.soc': 'social', 'cat.blog': 'blogs', 'cat.media': 'media',
    'cat.work': 'work', 'cat.game': 'games', 'cat.link': 'links', 'cat.risk': 'risk', 'cat.infra': 'infrastructure',
    'state.found': 'trace found', 'state.free': 'clear', 'state.unknown': 'review manually',
    'kind.username': 'username', 'kind.email': 'email', 'kind.domain': 'domain',
    'time.unit': 's',
    'signal.initial': 'ready to scan', 'signal.ready': '{count} sources ready', 'signal.detected': 'target detected', 'signal.none': 'not selected',
    'coverage.fallback': 'public sources',
    'report.request': 'Request', 'report.checkDelete': 'Review and remove', 'report.prepare': 'Prepare a request for',
    'report.open': 'open profile', 'report.visible': 'visible profile', 'report.quiet': 'quiet profile',
    'scan.again': 'Check again', 'scan.running': 'Scanning…',
    'scan.wait': 'Scanning live sources. This may take a few seconds.', 'scan.connection': 'Connection lost. Try again.',
    'scan.doneFound': '{count} traces found. You now have a map and a clear place to start.',
    'scan.doneEmpty': 'No matches were found in the checked public sources.',
    'erase.start': 'drag to build the route', 'erase.progress': 'route built: {value}%', 'erase.done': 'everything is now in view',
    'demo.title': 'demo-user · sample report', 'demo.note': 'The demo does not send requests to external sources.',
    'demo.publicRepos': 'public repositories', 'demo.publicProfile': 'public profile',
    'demo.oldMention': 'old mention', 'demo.archive': 'Archived profile',
    'letter.copied': 'Copied ✓', 'letter.copy': 'Copy',
    'sources.all': 'all', 'sources.error': 'Could not load the list. Try refreshing the page.'
  };

  const dictionaries = { ru, en };
  let language = localStorage.getItem(STORAGE.language) === 'en' ? 'en' : 'ru';
  let theme = localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark';

  const interpolate = (value, vars = {}) => String(value).replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  const t = (key, vars) => interpolate(dictionaries[language][key] ?? dictionaries.ru[key] ?? key, vars);

  const captureRussianCopy = () => {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      if (!(key in ru)) ru[key] = element.textContent.trim();
    });
    ['placeholder', 'aria-label'].forEach(attribute => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        const key = element.dataset[`i18n${attribute.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')}`];
        if (!(key in ru)) ru[key] = element.getAttribute(attribute);
      });
    });
  };

  const applyMeta = () => {
    const page = document.body.classList.contains('sources-page') ? 'sources' : 'home';
    document.title = language === 'en' ? t(`meta.${page}.title`) : document.documentElement.dataset.ruTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = language === 'en' ? t(`meta.${page}.description`) : document.documentElement.dataset.ruDescription;
  };

  const updateControls = () => {
    const langButton = document.querySelector('#lang-toggle');
    const themeButton = document.querySelector('#theme-toggle');
    if (langButton) {
      langButton.dataset.current = language;
      langButton.setAttribute('aria-label', language === 'ru' ? t('control.toEnglish') : t('control.toRussian'));
      langButton.setAttribute('title', langButton.getAttribute('aria-label'));
    }
    if (themeButton) {
      const label = themeButton.querySelector('#theme-label');
      if (label) label.textContent = theme === 'dark' ? t('control.light') : t('control.dark');
      themeButton.setAttribute('aria-label', theme === 'dark' ? t('control.toLight') : t('control.toDark'));
      themeButton.setAttribute('title', themeButton.getAttribute('aria-label'));
      themeButton.setAttribute('aria-pressed', String(theme === 'light'));
    }
  };

  const applyLanguage = (emit = true) => {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    ['placeholder', 'aria-label'].forEach(attribute => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        const property = `i18n${attribute.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')}`;
        element.setAttribute(attribute, t(element.dataset[property]));
      });
    });
    applyMeta();
    updateControls();
    if (emit) document.dispatchEvent(new CustomEvent('traceerase:languagechange', { detail: { language } }));
  };

  const setLanguage = next => {
    language = next === 'en' ? 'en' : 'ru';
    localStorage.setItem(STORAGE.language, language);
    applyLanguage();
  };

  const setTheme = next => {
    theme = next === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'light' ? '#f5f5f2' : '#0a0a0b';
    updateControls();
    document.dispatchEvent(new CustomEvent('traceerase:themechange', { detail: { theme } }));
  };

  const init = () => {
    document.documentElement.dataset.ruTitle = document.title;
    document.documentElement.dataset.ruDescription = document.querySelector('meta[name="description"]')?.content || '';
    captureRussianCopy();
    window.TraceUI = { t, getLanguage: () => language, getTheme: () => theme, setLanguage, setTheme, applyLanguage };
    document.querySelector('#lang-toggle')?.addEventListener('click', () => setLanguage(language === 'ru' ? 'en' : 'ru'));
    document.querySelector('#theme-toggle')?.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
    setTheme(theme);
    applyLanguage(false);
  };

  init();
})();

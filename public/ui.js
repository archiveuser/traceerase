(() => {
  const STORAGE = { language: 'traceerase-language', theme: 'traceerase-theme' };

  const ru = {
    'control.light': 'Светлая', 'control.dark': 'Тёмная',
    'control.toEnglish': 'Переключить на английский', 'control.toRussian': 'Переключить на русский',
    'control.toLight': 'Включить светлую тему', 'control.toDark': 'Включить тёмную тему',
    'control.settings': 'Настройки интерфейса',
    'hero.cta': 'Увидеть свой след', 'hero.note': 'Без регистрации. Только публичные ответы — без догадок.',
    'hero.freeKicker': 'ВСЕГДА БЕСПЛАТНО', 'hero.freeText': 'Полный отчёт, карта и экспорт — без подписки.',
    'intent.aria': 'Выбери цель проверки', 'intent.label': 'Цель проверки',
    'intent.general': 'Обзор', 'intent.career': 'Карьера', 'intent.public': 'Публичность', 'intent.reset': 'Новый этап',
    'intent.generalContext': 'общая картина', 'intent.careerContext': 'взгляд работодателя',
    'intent.publicContext': 'образ для аудитории', 'intent.resetContext': 'поиск старых следов',
    'cat.dev': 'технологии', 'cat.soc': 'соцсети', 'cat.message': 'мессенджеры', 'cat.blog': 'блоги', 'cat.media': 'медиа',
    'cat.work': 'работа', 'cat.creator': 'авторы', 'cat.market': 'маркетплейсы', 'cat.learn': 'знания',
    'cat.game': 'игры', 'cat.link': 'ссылки', 'cat.risk': 'риск', 'cat.infra': 'инфраструктура',
    'state.found': 'совпадение', 'state.free': 'не найдено', 'state.unknown': 'вывод невозможен',
    'kind.username': 'никнейм', 'kind.email': 'email', 'kind.domain': 'домен',
    'time.unit': 'с',
    'signal.initial': 'готов к проверке', 'signal.ready': '{count} источников в каталоге', 'signal.detected': 'отправная точка задана', 'signal.none': 'не задана',
    'redaction.aria': 'Демонстрация публичного цифрового следа', 'redaction.file': 'публичный след / демо',
    'redaction.ready': 'нажми, чтобы скрыть', 'redaction.armed': 'точка задана', 'redaction.done': 'контроль возвращён',
    'redaction.count': '{count} / {total} скрыто', 'redaction.hint': 'это демонстрация, а не результат',
    'redaction.f1Type': 'ПРОФИЛЬ / 2018', 'redaction.f1Name': '@старый_ник',
    'redaction.f2Type': 'ПУБЛИЧНЫЙ ПОСТ', 'redaction.f2Name': 'старый комментарий',
    'redaction.f3Type': 'ОТМЕТКА НА ФОТО', 'redaction.f3Name': 'видимое имя',
    'redaction.f4Type': 'ФОРУМ / 2020', 'redaction.f4Name': 'тот же ник',
    'coverage.fallback': 'публичных источников',
    'coverage.autoCount': '{count} авто',
    'report.request': 'Запрос', 'report.checkDelete': 'Проверь и удали', 'report.prepare': 'Подготовь запрос для',
    'report.found': 'публичных находок',
    'report.open': 'высокая видимость', 'report.visible': 'заметная видимость', 'report.quiet': 'низкая видимость',
    'report.insufficient': 'недостаточно данных',
    'report.waiting': '// ожидание данных…', 'report.progress': 'Проверено: {done} из {total} источников', 'report.savePdf': 'Печать / PDF', 'report.pdfHint': 'В окне печати выбери «Сохранить как PDF»',
    'report.downloadTxt': 'Скачать TXT', 'report.downloaded': 'TXT скачан ✓', 'report.downloadCard': 'Скачать карточку',
    'report.nextTitle.one': 'публичная находка. Что делать дальше?', 'report.nextTitle.few': 'публичные находки. Что делать дальше?', 'report.nextTitle.many': 'публичных находок. Что делать дальше?',
    'graph.kicker': 'Карта следа', 'graph.title': 'Связи появляются по мере проверки', 'graph.count': 'профилей',
    'graph.waiting': 'Ищем подтверждённые публичные связи…', 'graph.found': 'Подтверждено публичных профилей: {count}',
    'graph.empty': 'Подтверждённых публичных профилей пока нет.', 'graph.root': 'исходный идентификатор',
    'graph.rootTitle': 'Исходный идентификатор: {target}', 'graph.profile': 'публичный профиль', 'graph.zoneCount': 'подтверждено: {count}',
    'graph.legend': 'Линия идёт от идентификатора к тематической зоне, затем — к подтверждённому публичному профилю.',
    'graph.aria': 'Карта подтверждённых публичных следов',
    'stranger.file': 'PUBLIC DOSSIER', 'stranger.kicker': 'Взгляд со стороны', 'stranger.title': 'Как тебя увидит',
    'stranger.visibleAt': 'Заметные точки', 'stranger.score': 'Индекс видимости',
    'stranger.scoreAria': 'Индекс публичной видимости', 'stranger.scoreAriaValue': 'Индекс публичной видимости: {score} из 100, {grade}',
    'stranger.scoreAriaUnavailable': 'Индекс публичной видимости не рассчитан: недостаточно данных',
    'stranger.scoreNote': 'Ориентир по числу найденных страниц и типов источников. Это не оценка опасности.',
    'stranger.scoreNoteInsufficient': 'Источники не подтвердили ни наличие, ни отсутствие профилей. Индекс намеренно не рассчитан.',
    'stranger.target': 'Отправная точка', 'stranger.matches': 'Совпадений · проверок', 'stranger.categories': 'Категории',
    'stranger.role.general': 'незнакомец', 'stranger.role.career': 'работодатель',
    'stranger.role.public': 'новая аудитория', 'stranger.role.reset': 'человек, который ищет старый ник',
    'stranger.summary.high': 'Для роли «{viewer}» профили легко связываются в единую картину: найдено {count}. Первым проверь {source}.',
    'stranger.summary.medium': 'Публичный образ уже складывается из нескольких точек. Начни с {source}, затем пройди маршрут ниже.',
    'stranger.summary.quiet': 'Найдено немного публичных точек. Проверь {source} и реши, должен ли этот профиль оставаться заметным.',
    'stranger.summary.empty': 'В проверенных источниках прямых совпадений нет. Сохрани результат как исходную точку и повтори проверку позже.',
    'stranger.summary.insufficient': 'Недостаточно данных для честного вывода: {count} проверок профилей не дали однозначного ответа. Повтори проверку позже или используй ручные маршруты.',
    'stranger.noMatches': 'прямых совпадений нет', 'stranger.noConclusion': 'недостаточно данных для вывода',
    'cleanup.progress': 'Пройдено', 'cleanup.firstTitle': 'Сначала проверь {source}', 'cleanup.hitTitle': 'Проверь {source}',
    'cleanup.reason.general': 'Категория «{category}» заметна в общей картине.',
    'cleanup.reason.career': 'Этот источник влияет на профессиональный образ.',
    'cleanup.reason.public': 'Эту точку легко увидит новая аудитория.',
    'cleanup.reason.reset': 'Этот профиль стоит проверить на актуальность.',
    'cleanup.intent.generalTitle': 'Сверь связи между профилями', 'cleanup.intent.generalText': 'Проверь повторяющиеся ник, фото и описание.',
    'cleanup.intent.careerTitle': 'Раздели личное и профессиональное', 'cleanup.intent.careerText': 'Оставь в открытом доступе то, что поддерживает нужный образ.',
    'cleanup.intent.publicTitle': 'Собери единый публичный образ', 'cleanup.intent.publicText': 'Сверь имя, описание и ссылки на ключевых площадках.',
    'cleanup.intent.resetTitle': 'Закрой забытые профили', 'cleanup.intent.resetText': 'Начни с аккаунтов, которыми больше не пользуешься.',
    'cleanup.privacyTitle': 'Проверь настройки видимости', 'cleanup.privacyText': 'Скрой старые публикации и лишние публичные поля.',
    'cleanup.decideTitle': 'Реши судьбу найденного', 'cleanup.decideText': 'Оставь, скрой, удали или подготовь обращение.',
    'cleanup.aliasesTitle': 'Проверь прошлые варианты ника', 'cleanup.aliasesText': 'Повтори поиск по старым написаниям и псевдонимам.',
    'cleanup.rescanTitle': 'Повтори проверку', 'cleanup.rescanText': 'Сравни результат после изменений и отметь прогресс.',
    'cleanup.open': 'Открыть действие: {source}',
    'card.demo': 'ДЕМО', 'card.publicView': 'Публичный образ', 'card.intent': 'Сценарий', 'card.visibility': 'Индекс видимости',
    'card.matches': 'Совпадения · проверки', 'card.categories': 'Категории', 'card.review': 'Проверить сначала',
    'card.note': 'Индекс TraceErase показывает видимость, а не угрозу.',
    'card.noteInsufficient': 'Индекс не рассчитан: источники не дали достаточно данных.',
    'scan.again': 'Проверить ещё раз', 'scan.running': 'Сканирую…',
    'scan.wait': 'Идёт сканирование. Запросы уходят на реальные сайты — это занимает несколько секунд.',
    'scan.connection': 'Соединение потеряно. Попробуй ещё раз.',
    'scan.doneFound': 'Обнаружено {count} публичных результатов. Открой их и проверь контекст.',
    'scan.doneFound.one': 'Обнаружен {count} публичный результат. Открой его и проверь контекст.',
    'scan.doneFound.few': 'Обнаружено {count} публичных результата. Открой их и проверь контекст.',
    'scan.doneFound.many': 'Обнаружено {count} публичных результатов. Открой их и проверь контекст.',
    'scan.doneEmpty': 'В проверенных публичных источниках совпадений не найдено.',
    'scan.doneUnknown': 'Источники не дали достаточно однозначных ответов. Это не означает, что совпадений нет.',
    'erase.start': 'потяни, чтобы собрать маршрут', 'erase.progress': 'маршрут собран на {value}%', 'erase.done': 'теперь всё перед глазами',
    'demo.title': 'demo-user · пример отчёта', 'demo.note': 'Демо не отправляет запросы во внешние источники.',
    'demo.publicRepos': 'публичные репозитории', 'demo.publicProfile': 'публичный профиль',
    'demo.oldMention': 'старое упоминание', 'demo.archive': 'Архивный профиль',
    'letter.copied': 'Скопировано ✓', 'letter.copy': 'Скопировать',
    'sources.all': 'все', 'sources.error': 'Не удалось загрузить список. Попробуй обновить страницу.', 'sources.empty': 'По этому фильтру источников нет.',
    'sources.autoTotal': 'автоматически', 'sources.manualTotal': 'ручных маршрутов',
    'sources.searchLabel': 'Найти сервис', 'sources.searchPlaceholder': 'VK, MAX, GitHub…', 'sources.modeAria': 'Режим проверки',
    'sources.mode.all': 'все режимы', 'sources.mode.auto': 'авто', 'sources.mode.manual': 'вручную',
    'sources.open': 'Открыть официальный сайт {source}', 'sources.noPublicUsername': 'нет публичного поиска по нику',
    'manual.kicker': 'Ручной слой', 'manual.title': 'источников без ложной автоматики',
    'manual.text': 'Эти сервисы требуют входа, полного адреса или не имеют публичного профиля по нику. Ссылка использует тот же ник (для email — часть до @) только как подсказку: совпадение нужно подтвердить самому.',
    'manual.all': 'Открыть весь ручной каталог →', 'manual.open': 'Открыть {source} для ручной проверки',
    'export.personalTitle': 'личный подробный отчёт', 'export.generated': 'Создан', 'export.mode': 'Режим',
    'export.mode.scan': 'реальная проверка', 'export.mode.demo': 'демонстрация', 'export.target': 'Исходный идентификатор',
    'export.kind': 'Тип', 'export.intent': 'Цель', 'export.duration': 'Длительность', 'export.catalog': 'Каталог',
    'export.automatic': 'автоматически', 'export.manual': 'вручную', 'export.attempts': 'Запущено проверок',
    'export.responses': 'Строк в отчёте', 'export.profileMatches': 'Совпадений профилей-кандидатов',
    'export.conclusive': 'Однозначных ответов по профилям',
    'export.visibility': 'Индекс видимости', 'export.resultsTitle': 'Результаты',
    'export.category': 'Категория', 'export.status': 'Статус', 'export.method': 'Метод', 'export.checkedAt': 'Проверено',
    'export.detail': 'Детали', 'export.noResults': 'Результатов нет.',
    'export.state.found': 'публичный ответ обнаружен — совпадение нужно подтвердить',
    'export.state.free': 'искомый результат не обнаружен в момент проверки',
    'export.state.unknown': 'источник не позволил сделать вывод',
    'export.method.status': 'HTTP-статус публичного API', 'export.method.json-array': 'точное совпадение в JSON API',
    'export.method.marker': 'маркер публичного ответа', 'export.method.redirect': 'публичная страница / редирект',
    'export.method.gravatar': 'публичный ответ Gravatar', 'export.method.dns': 'DNS-over-HTTPS',
    'export.method.hibp': 'Have I Been Pwned API', 'export.method.rdap': 'публичный RDAP',
    'export.method.certificate-transparency': 'Certificate Transparency', 'export.method.demo': 'демонстрационные данные',
    'export.disclaimerMatch': 'Совпадение ника не доказывает, что страница принадлежит тому же человеку.',
    'export.disclaimerMissing': '«Не найдено» описывает только ответ источника в момент этой проверки.',
    'export.disclaimerScore': 'Индекс видимости — ориентир, а не оценка угрозы или доказательство личности.',
    'export.disclaimerIncomplete': 'Ответы «вывод невозможен» не считаются отсутствием профиля и снижают полноту отчёта.',
    'export.pdfScope': 'PDF показывает совпадения и неопределённые ответы; {count} строк «не найдено» остаются в полном TXT.',
    'trust.kicker': 'Контроль без магии', 'trust.title': 'TraceErase показывает путь.', 'trust.title2': 'Последнее слово — твоё.',
    'trust.lead': 'Сервис работает как навигатор по публичному цифровому следу: собирает картину и помогает перейти от находки к решению.',
    'trust.finds': 'Находит публичные страницы', 'trust.groups': 'Собирает совпадения в одну картину', 'trust.suggests': 'Предлагает порядок действий',
    'trust.you': 'ТЫ', 'trust.verify': 'Проверяешь совпадения', 'trust.decide': 'Решаешь, что оставить публичным', 'trust.act': 'Сам запускаешь нужное действие',
    'trust.public': 'Публичные источники', 'trust.local': 'Карточка создаётся в браузере', 'trust.choice': 'Никаких решений за тебя'
  };

  const en = {
    'meta.home.title': 'TraceErase — see yourself through the internet’s eyes',
    'meta.home.description': 'TraceErase finds public profiles and turns your digital footprint into a clear action plan.',
    'meta.sources.title': 'TraceErase sources — where we look for digital traces',
    'meta.sources.description': '246 TraceErase sources: reliable automatic checks and official manual routes without false matches.',
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
    'hero.cta': 'See my footprint', 'hero.note': 'No sign-up. Public responses only — no guesses.', 'hero.demo': 'View a sample report',
    'hero.freeKicker': 'ALWAYS FREE', 'hero.freeText': 'Full report, map, and export — no subscription.',
    'hero.mapAria': 'Example TraceErase source map', 'hero.mapLive': 'public view / live', 'hero.target': 'starting point',
    'redaction.aria': 'Demonstration of a public digital footprint', 'redaction.file': 'public trace / demo',
    'redaction.ready': 'click to redact', 'redaction.armed': 'starting point set', 'redaction.done': 'control restored',
    'redaction.count': '{count} / {total} redacted', 'redaction.hint': 'demonstration, not a result',
    'redaction.f1Type': 'PROFILE / 2018', 'redaction.f1Name': '@old_handle',
    'redaction.f2Type': 'PUBLIC POST', 'redaction.f2Name': 'old comment',
    'redaction.f3Type': 'TAGGED PHOTO', 'redaction.f3Name': 'visible name',
    'redaction.f4Type': 'FORUM / 2020', 'redaction.f4Name': 'same alias',
    'hero.profiles': 'profiles', 'hero.media': 'media', 'hero.work': 'work', 'hero.games': 'games',
    'hero.outcomesAria': 'What TraceErase gives you', 'hero.find': 'find', 'hero.understand': 'understand', 'hero.control': 'take control',
    'intent.aria': 'Choose a scan goal', 'intent.label': 'Scan goal',
    'intent.general': 'Overview', 'intent.career': 'Career', 'intent.public': 'Going public', 'intent.reset': 'Fresh start',
    'intent.generalContext': 'the whole picture', 'intent.careerContext': 'an employer’s view',
    'intent.publicContext': 'your audience-facing image', 'intent.resetContext': 'old footprint search',
    'value.kicker': 'Why it matters', 'value.title': 'Stop searching one site at a time.', 'value.titleAccent': 'See the whole picture.',
    'value.find': 'Find', 'value.findText': 'Old profiles and public pages that are easy to forget.',
    'value.understand': 'Understand', 'value.understandText': 'Which parts of your online history are visible to a stranger.',
    'value.act': 'Act', 'value.actText': 'Go straight to the source and start with the most visible traces.',
    'report.kicker': 'Report', 'report.scanning': 'Scanning…', 'report.progressAria': 'Scan progress',
    'report.found': 'public findings', 'report.clean': 'not found now', 'report.unknown': 'no conclusion', 'report.time': 'elapsed',
    'report.traces': 'Traces', 'report.all': 'All', 'report.foundLead': 'Found', 'report.nextTitle': 'traces. What now?',
    'report.nextText': 'We turned the findings into a short route — start with the most visible one.', 'report.openRoute': 'Open the route →',
    'report.save': 'Save report', 'report.savePdf': 'Print / PDF', 'report.pdfHint': 'Choose “Save as PDF” in the print dialog',
    'report.downloadTxt': 'Download TXT', 'report.downloaded': 'TXT downloaded ✓', 'report.downloadCard': 'Download card',
    'report.route': 'Cleanup route', 'report.start': 'Where to begin', 'report.visibility': 'visibility',
    'graph.kicker': 'Trace map', 'graph.title': 'Connections appear as the check runs', 'graph.count': 'profiles',
    'graph.waiting': 'Looking for confirmed public connections…', 'graph.found': 'Confirmed public profiles: {count}',
    'graph.empty': 'No confirmed public profiles yet.', 'graph.root': 'source identifier',
    'graph.rootTitle': 'Source identifier: {target}', 'graph.profile': 'public profile', 'graph.zoneCount': 'confirmed: {count}',
    'graph.legend': 'A line runs from the identifier to a topic zone, then to a confirmed public profile.',
    'graph.aria': 'Map of confirmed public traces',
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
    'coverage.lead': 'Every source has an honest mode: automatic only when its response is reliable, otherwise a direct manual route.', 'coverage.all': 'View every source',
    'how.kicker': 'How it works', 'how.title': 'From one line', 'how.title2': 'to a clear picture',
    'how.lead': 'Three sequential steps. No tables you have to decode on your own.',
    'how.oneTitle': 'Choose a starting point', 'how.oneText': 'Enter a username, email, or domain — the same clue someone else could already use.',
    'how.twoTitle': 'TraceErase checks the sources', 'how.twoText': 'Reliable public responses are checked automatically; closed services become manual routes, with no invented matches.',
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
    'sources.lead': 'TraceErase separates automatic checks from manual routes. Automation only runs where a public response can be classified without guessing.',
    'sources.total': 'sources in the catalog', 'sources.filterAria': 'Source filter',
    'sources.note': '“Automatic” means a verifiable public response. “Manual” is an official route without a found/free verdict. Always confirm a handle match: it does not prove identity.',
    'sources.autoTotal': 'automatic checks', 'sources.manualTotal': 'manual routes',
    'sources.searchLabel': 'Find a service', 'sources.searchPlaceholder': 'VK, MAX, GitHub…', 'sources.modeAria': 'Check mode',
    'sources.mode.all': 'all modes', 'sources.mode.auto': 'automatic', 'sources.mode.manual': 'manual',
    'sources.open': 'Open the official {source} website', 'sources.noPublicUsername': 'no public username lookup',
    'control.light': 'Light', 'control.dark': 'Dark',
    'cat.dev': 'technology', 'cat.soc': 'social', 'cat.message': 'messengers', 'cat.blog': 'blogs', 'cat.media': 'media',
    'cat.work': 'work', 'cat.creator': 'creators', 'cat.market': 'marketplaces', 'cat.learn': 'knowledge',
    'cat.game': 'games', 'cat.link': 'links', 'cat.risk': 'risk', 'cat.infra': 'infrastructure',
    'state.found': 'handle match', 'state.free': 'not found', 'state.unknown': 'no conclusion',
    'kind.username': 'username', 'kind.email': 'email', 'kind.domain': 'domain',
    'time.unit': 's',
    'signal.initial': 'ready to scan', 'signal.ready': '{count} sources catalogued', 'signal.detected': 'starting point set', 'signal.none': 'not set',
    'coverage.fallback': 'public sources',
    'coverage.autoCount': '{count} auto',
    'report.request': 'Request', 'report.checkDelete': 'Review and remove', 'report.prepare': 'Prepare a request for',
    'report.open': 'high visibility', 'report.visible': 'visible', 'report.quiet': 'low visibility',
    'report.insufficient': 'insufficient data',
    'report.waiting': '// waiting for data…', 'report.progress': 'Checked: {done} of {total} sources',
    'report.nextTitle.one': 'public finding. What now?', 'report.nextTitle.few': 'public findings. What now?', 'report.nextTitle.many': 'public findings. What now?',
    'stranger.file': 'PUBLIC DOSSIER', 'stranger.kicker': 'Outside view', 'stranger.title': 'How you look to',
    'stranger.visibleAt': 'Visible touchpoints', 'stranger.score': 'Visibility index',
    'stranger.scoreAria': 'Public visibility index', 'stranger.scoreAriaValue': 'Public visibility index: {score} out of 100, {grade}',
    'stranger.scoreAriaUnavailable': 'Public visibility index was not calculated: insufficient data',
    'stranger.scoreNote': 'A guide based on the number of pages found and source types. It is not a threat rating.',
    'stranger.scoreNoteInsufficient': 'Sources confirmed neither profile presence nor absence, so the index was intentionally not calculated.',
    'stranger.target': 'Starting point', 'stranger.matches': 'Matches · checks', 'stranger.categories': 'Categories',
    'stranger.role.general': 'a stranger', 'stranger.role.career': 'an employer',
    'stranger.role.public': 'a new audience', 'stranger.role.reset': 'someone searching an old handle',
    'stranger.summary.high': 'For {viewer}, the profiles are easy to connect into one picture: {count} matches found. Review {source} first.',
    'stranger.summary.medium': 'A public image already forms from several touchpoints. Start with {source}, then follow the route below.',
    'stranger.summary.quiet': 'Only a few public touchpoints were found. Review {source} and decide whether this profile should stay visible.',
    'stranger.summary.empty': 'No direct matches were found in the checked sources. Save this as a baseline and scan again later.',
    'stranger.summary.insufficient': 'There is not enough data for an honest conclusion: {count} profile checks were inconclusive. Try again later or use the manual routes.',
    'stranger.noMatches': 'no direct matches', 'stranger.noConclusion': 'insufficient data for a conclusion',
    'cleanup.progress': 'Completed', 'cleanup.firstTitle': 'Review {source} first', 'cleanup.hitTitle': 'Review {source}',
    'cleanup.reason.general': 'The “{category}” category stands out in the overall picture.',
    'cleanup.reason.career': 'This source shapes your professional image.',
    'cleanup.reason.public': 'This touchpoint is easy for a new audience to find.',
    'cleanup.reason.reset': 'Check whether this profile is still current.',
    'cleanup.intent.generalTitle': 'Compare the links between profiles', 'cleanup.intent.generalText': 'Check repeated handles, photos, and bios.',
    'cleanup.intent.careerTitle': 'Separate personal and professional', 'cleanup.intent.careerText': 'Keep public what supports the image you want.',
    'cleanup.intent.publicTitle': 'Build one public-facing image', 'cleanup.intent.publicText': 'Align your name, bio, and links across key platforms.',
    'cleanup.intent.resetTitle': 'Close forgotten profiles', 'cleanup.intent.resetText': 'Start with accounts you no longer use.',
    'cleanup.privacyTitle': 'Review visibility settings', 'cleanup.privacyText': 'Hide old posts and unnecessary public fields.',
    'cleanup.decideTitle': 'Decide what happens to each trace', 'cleanup.decideText': 'Keep, hide, delete, or prepare a request.',
    'cleanup.aliasesTitle': 'Check previous handle variants', 'cleanup.aliasesText': 'Repeat the search with old spellings and aliases.',
    'cleanup.rescanTitle': 'Scan again', 'cleanup.rescanText': 'Compare the result after your changes and mark progress.',
    'cleanup.open': 'Open action: {source}',
    'card.demo': 'DEMO', 'card.publicView': 'Public view', 'card.intent': 'Scenario', 'card.visibility': 'Visibility index',
    'card.matches': 'Matches · checks', 'card.categories': 'Categories', 'card.review': 'Review first',
    'card.note': 'The TraceErase index measures visibility, not threat.',
    'card.noteInsufficient': 'The index was not calculated: sources returned insufficient data.',
    'scan.again': 'Check again', 'scan.running': 'Scanning…',
    'scan.wait': 'Scanning live sources. This may take a few seconds.', 'scan.connection': 'Connection lost. Try again.',
    'scan.doneFound': '{count} public findings detected. Open them and check the context.',
    'scan.doneFound.one': '{count} public finding detected. Open it and check the context.',
    'scan.doneFound.few': '{count} public findings detected. Open them and check the context.',
    'scan.doneFound.many': '{count} public findings detected. Open them and check the context.',
    'scan.doneEmpty': 'No matches were found in the checked public sources.',
    'scan.doneUnknown': 'Sources returned too few conclusive responses. This does not mean no matches exist.',
    'erase.start': 'drag to build the route', 'erase.progress': 'route built: {value}%', 'erase.done': 'everything is now in view',
    'demo.title': 'demo-user · sample report', 'demo.note': 'The demo does not send requests to external sources.',
    'demo.publicRepos': 'public repositories', 'demo.publicProfile': 'public profile',
    'demo.oldMention': 'old mention', 'demo.archive': 'Archived profile',
    'letter.copied': 'Copied ✓', 'letter.copy': 'Copy',
    'sources.all': 'all', 'sources.error': 'Could not load the list. Try refreshing the page.', 'sources.empty': 'No sources match these filters.',
    'manual.kicker': 'Manual layer', 'manual.title': 'sources without false automation',
    'manual.text': 'These services require sign-in, a full address, or do not expose a public username profile. A link reuses the same handle (the part before @ for email) only as a clue; confirm the match yourself.',
    'manual.all': 'Open the full manual catalog →', 'manual.open': 'Open {source} for a manual check',
    'export.personalTitle': 'private detailed report', 'export.generated': 'Generated', 'export.mode': 'Mode',
    'export.mode.scan': 'live check', 'export.mode.demo': 'demo', 'export.target': 'Original identifier',
    'export.kind': 'Type', 'export.intent': 'Purpose', 'export.duration': 'Duration', 'export.catalog': 'Catalog',
    'export.automatic': 'automatic', 'export.manual': 'manual', 'export.attempts': 'Checks started',
    'export.responses': 'Report rows', 'export.profileMatches': 'Candidate profile matches',
    'export.conclusive': 'Conclusive profile responses',
    'export.visibility': 'Visibility index', 'export.resultsTitle': 'Results',
    'export.category': 'Category', 'export.status': 'Status', 'export.method': 'Method', 'export.checkedAt': 'Checked',
    'export.detail': 'Details', 'export.noResults': 'No results.',
    'export.state.found': 'a public response was detected — confirm the match',
    'export.state.free': 'the requested result was not found at check time',
    'export.state.unknown': 'the source did not allow a conclusion',
    'export.method.status': 'public API HTTP status', 'export.method.json-array': 'exact JSON API match',
    'export.method.marker': 'public-response marker', 'export.method.redirect': 'public page / redirect',
    'export.method.gravatar': 'public Gravatar response', 'export.method.dns': 'DNS over HTTPS',
    'export.method.hibp': 'Have I Been Pwned API', 'export.method.rdap': 'public RDAP',
    'export.method.certificate-transparency': 'Certificate Transparency', 'export.method.demo': 'sample data',
    'export.disclaimerMatch': 'A matching handle does not prove that the page belongs to the same person.',
    'export.disclaimerMissing': '“Not found” only describes the source response at the time of this check.',
    'export.disclaimerScore': 'The visibility index is a guide, not a threat rating or proof of identity.',
    'export.disclaimerIncomplete': '“Inconclusive” responses are never counted as profile absence and reduce report completeness.',
    'export.pdfScope': 'The PDF shows matches and inconclusive responses; {count} “not found” rows remain in the full TXT.',
    'trust.kicker': 'Control without magic', 'trust.title': 'TraceErase shows the route.', 'trust.title2': 'The final choice is yours.',
    'trust.lead': 'The service is a navigator for your public digital footprint: it builds the picture and helps turn a finding into a decision.',
    'trust.finds': 'Finds public pages', 'trust.groups': 'Brings matches into one picture', 'trust.suggests': 'Suggests an order of action',
    'trust.you': 'YOU', 'trust.verify': 'Verify every match', 'trust.decide': 'Choose what remains public', 'trust.act': 'Start each action yourself',
    'trust.public': 'Public sources', 'trust.local': 'The card is made in your browser', 'trust.choice': 'No decisions made for you'
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
    ['placeholder', 'aria-label', 'title'].forEach(attribute => {
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
    ['placeholder', 'aria-label', 'title'].forEach(attribute => {
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

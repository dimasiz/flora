// ========================================
// FIREBASE CONFIGURATION
// ========================================

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrV9nz7mh5ZFxLRrkTa9g8Yoa-mLZUquk",
    authDomain: "flora-f1ce9.firebaseapp.com",
    databaseURL: "https://flora-f1ce9-default-rtdb.firebaseio.com",
    projectId: "flora-f1ce9",
    storageBucket: "flora-f1ce9.firebasestorage.app",
    messagingSenderId: "93105868322",
    appId: "1:93105868322:web:ab5fb4d0faf2d5cf77447b"
};

// ========================================
// FIREBASE INITIALIZATION (ES Module)
// ========================================

let firebaseApp = null;
let firebaseAuth = null;
var firebaseDatabase = null; // Changed to var for global access

// Firebase initialization state
let firebaseInitializationPromise = null;
let isFirebaseReady = false;

// Initialize Firebase when script loads
async function initializeFirebase() {
    // If already initializing, return the existing promise
    if (firebaseInitializationPromise) {
        return firebaseInitializationPromise;
    }

    firebaseInitializationPromise = (async () => {
        try {
            console.log('🔄 Начинаю инициализацию Firebase...');

            // Dynamic import of Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js');
            const { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js');
            const { getDatabase, ref, set, get, update, onValue, push } = await import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js');

            // Initialize Firebase App
            firebaseApp = initializeApp(firebaseConfig);
            firebaseAuth = getAuth(firebaseApp);
            firebaseDatabase = getDatabase(firebaseApp);
            window.firebaseDatabase = firebaseDatabase; // Make database globally accessible

            // Store Firebase methods globally
            window.firebaseMethods = {
                // Auth methods
                createUserWithEmailAndPassword,
                signInWithEmailAndPassword,
                signOut,
                updateProfile,
                onAuthStateChanged,
                // Database methods
                ref,
                set,
                get,
                update,
                onValue,
                push
            };

            isFirebaseReady = true;
            console.log('✅ Firebase успешно инициализирован!');

            // Listen for auth state changes
            onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    console.log('👤 Пользователь авторизован:', user.email);
                    window.currentUser = user;
                    updateUIForAuth(true, user);
                } else {
                    console.log('👤 Пользователь не авторизован');
                    window.currentUser = null;
                    updateUIForAuth(false, null);
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            firebaseInitializationPromise = null;
            return false;
        }
    })();

    return firebaseInitializationPromise;
}

// Wait for Firebase to be ready (can be called by other scripts)
function waitForFirebase() {
    if (isFirebaseReady) {
        return Promise.resolve(true);
    }
    return firebaseInitializationPromise || Promise.resolve(false);
}

// Export waitForFirebase globally for use in other scripts
window.waitForFirebase = waitForFirebase;

// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

// Register new user
async function registerUser(email, password, displayName) {
    await waitForFirebase();

    try {
        const { createUserWithEmailAndPassword, updateProfile } = window.firebaseMethods;

        // Create user
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, { displayName: displayName });
        
        // Create user profile in database
        await createUserProfile(user.uid, {
            displayName: displayName,
            email: email,
            createdAt: new Date().toISOString(),
            avatar: getRandomAvatar()
        });
        
        console.log('✅ Пользователь зарегистрирован:', user.email);
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

// Login user
async function loginUser(email, password) {
    await waitForFirebase();

    try {
        const { signInWithEmailAndPassword } = window.firebaseMethods;
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        console.log('✅ Пользователь вошёл:', userCredential.user.email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
}

// Logout user
async function logoutUser() {
    try {
        const { signOut } = window.firebaseMethods;
        await signOut(firebaseAuth);
        console.log('✅ Пользователь вышел');
        return { success: true };
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        return { success: false, error: error.message };
    }
}

// Get current user
function getCurrentUser() {
    return window.currentUser || null;
}

// Check if user is logged in
function isLoggedIn() {
    return window.currentUser !== null;
}

// Get user-friendly error messages
function getAuthErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Этот email уже зарегистрирован',
        'auth/invalid-email': 'Неверный формат email',
        'auth/operation-not-allowed': 'Операция не разрешена',
        'auth/weak-password': 'Пароль слишком простой (минимум 6 символов)',
        'auth/user-disabled': 'Аккаунт заблокирован',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/invalid-credential': 'Неверный email или пароль',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
        'auth/network-request-failed': 'Ошибка сети. Проверьте подключение'
    };
    return messages[errorCode] || 'Произошла ошибка. Попробуйте ещё раз';
}

// Random avatar for new users
function getRandomAvatar() {
    const avatars = ['🦊', '🐻', '🐰', '🦉', '🐿️', '🦔', '🐸', '🦋', '🐝', '🦌'];
    return avatars[Math.floor(Math.random() * avatars.length)];
}

// ========================================
// DATABASE FUNCTIONS - USER PROFILE
// ========================================

// Create user profile
async function createUserProfile(userId, profileData) {
    await waitForFirebase();
    try {
        const { ref, set } = window.firebaseMethods;
        await set(ref(firebaseDatabase, `users/${userId}/profile`), profileData);
        
        // Initialize empty progress
        await set(ref(firebaseDatabase, `users/${userId}/progress`), {
            games: {},
            totalScore: 0,
            gamesPlayed: 0,
            levelsCompleted: 0
        });
        
        console.log('✅ Профиль создан');
        return true;
    } catch (error) {
        console.error('❌ Ошибка создания профиля:', error);
        return false;
    }
}

// Get user profile
async function getUserProfile(userId) {
    await waitForFirebase();
    try {
        const { ref, get } = window.firebaseMethods;
        const snapshot = await get(ref(firebaseDatabase, `users/${userId}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('❌ Ошибка получения профиля:', error);
        return null;
    }
}

// Update user profile
async function updateUserProfile(userId, updates) {
    await waitForFirebase();
    try {
        const { ref, update } = window.firebaseMethods;
        await update(ref(firebaseDatabase, `users/${userId}/profile`), updates);
        return true;
    } catch (error) {
        console.error('❌ Ошибка обновления профиля:', error);
        return false;
    }
}

// ========================================
// DATABASE FUNCTIONS - GAME PROGRESS
// ========================================

// Save game progress to Firebase
async function saveGameProgress(gameName, level, score, completed = true) {
    const user = getCurrentUser();
    if (!user) {
        // Save to localStorage if not logged in
        console.log('⚠️ Пользователь не авторизован, сохранение в localStorage');
        gameProgress.saveProgress(gameName, level, score);
        return true;
    }

    // Wait for Firebase to be ready
    try {
        await waitForFirebase();
    } catch (error) {
        console.error('❌ Ошибка ожидания Firebase:', error);
        gameProgress.saveProgress(gameName, level, score);
        return false;
    }

    // Check if Firebase is initialized
    if (!window.firebaseMethods || !firebaseDatabase) {
        console.error('❌ Firebase не инициализирован при попытке сохранить прогресс');
        // Fallback to localStorage
        gameProgress.saveProgress(gameName, level, score);
        return false;
    }

    try {
        const { ref, get, set, update } = window.firebaseMethods;
        const userId = user.uid;
        console.log('💾 Сохранение прогресса:', { gameName, level, score, completed, userId });
        
        // Get current progress
        const progressRef = ref(firebaseDatabase, `users/${userId}/progress`);
        const snapshot = await get(progressRef);
        let progress = snapshot.exists() ? snapshot.val() : {
            games: {},
            totalScore: 0,
            gamesPlayed: 0,
            levelsCompleted: 0
        };
        
        // Initialize game if not exists
        if (!progress.games[gameName]) {
            progress.games[gameName] = {
                completedLevels: [],
                highScores: {},
                lastPlayed: null
            };
        }

        const gameData = progress.games[gameName];

        // Validate game data structure
        if (!Array.isArray(gameData.completedLevels)) {
            gameData.completedLevels = [];
        }
        if (!gameData.highScores || typeof gameData.highScores !== 'object') {
            gameData.highScores = {};
        }

        // Update level completion
        if (completed && !gameData.completedLevels.includes(level)) {
            gameData.completedLevels.push(level);
            progress.levelsCompleted = (progress.levelsCompleted || 0) + 1;
        }
        
        // Update high score
        if (!gameData.highScores[level] || score > gameData.highScores[level]) {
            const scoreDiff = score - (gameData.highScores[level] || 0);
            gameData.highScores[level] = score;
            progress.totalScore = (progress.totalScore || 0) + scoreDiff;
        }

        // Update last played
        gameData.lastPlayed = new Date().toISOString();

        // Calculate gamesPlayed based on games with at least one completed level
        progress.gamesPlayed = Object.values(progress.games).filter(g =>
            g.completedLevels && g.completedLevels.length > 0
        ).length;

        // Save to Firebase
        await set(progressRef, progress);
        
        // Also save to localStorage as backup
        gameProgress.saveProgress(gameName, level, score);
        
        console.log('✅ Прогресс сохранён в Firebase:', { gameName, level, score, completed });
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения прогресса в Firebase:', error);
        console.error('Детали ошибки:', {
            gameName,
            level,
            score,
            completed,
            errorMessage: error.message,
            errorCode: error.code
        });
        // Fallback to localStorage
        gameProgress.saveProgress(gameName, level, score);
        return false;
    }
}

// Get user's game progress from Firebase
async function getGameProgressFromFirebase(gameName) {
    const user = getCurrentUser();
    if (!user) {
        return gameProgress.getProgress(gameName);
    }

    await waitForFirebase();

    try {
        const { ref, get } = window.firebaseMethods;
        const userId = user.uid;
        
        const snapshot = await get(ref(firebaseDatabase, `users/${userId}/progress/games/${gameName}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return { completedLevels: [], highScores: {} };
    } catch (error) {
        console.error('❌ Ошибка получения прогресса:', error);
        return gameProgress.getProgress(gameName);
    }
}

// Get all progress stats
async function getAllProgressStats() {
    const user = getCurrentUser();
    if (!user) {
        // Return local stats
        return getLocalProgressStats();
    }

    await waitForFirebase();

    try {
        const { ref, get } = window.firebaseMethods;
        const userId = user.uid;

        const snapshot = await get(ref(firebaseDatabase, `users/${userId}/progress`));
        if (snapshot.exists()) {
            const stats = snapshot.val();
            // Recalculate gamesPlayed to ensure it's correct
            if (stats.games) {
                stats.gamesPlayed = Object.values(stats.games).filter(g =>
                    g.completedLevels && g.completedLevels.length > 0
                ).length;
            }
            return stats;
        }
        return {
            games: {},
            totalScore: 0,
            gamesPlayed: 0,
            levelsCompleted: 0
        };
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        return getLocalProgressStats();
    }
}

// Get local progress stats (for non-logged users)
function getLocalProgressStats() {
    const games = ['findMe', 'whoEats', 'puzzle', 'whoLives', 'truthMyth'];
    let totalScore = 0;
    let levelsCompleted = 0;
    let gamesProgress = {};
    
    games.forEach(game => {
        const progress = gameProgress.getProgress(game);
        gamesProgress[game] = progress;
        levelsCompleted += progress.completedLevels.length;
        Object.values(progress.highScores).forEach(score => {
            totalScore += score;
        });
    });
    
    // Calculate gamesPlayed based on games with at least one completed level
    const gamesPlayed = Object.values(gamesProgress).filter(g =>
        g.completedLevels && g.completedLevels.length > 0
    ).length;

    return {
        games: gamesProgress,
        totalScore,
        gamesPlayed,
        levelsCompleted
    };
}

// ========================================
// REAL-TIME LISTENERS
// ========================================

// Listen to progress updates in real-time
async function listenToProgressUpdates(userId, callback) {
    if (!userId || !callback) {
        console.error('❌ userId и callback обязательны для listenToProgressUpdates');
        return null;
    }

    await waitForFirebase();

    try {
        const { ref, onValue } = window.firebaseMethods;
        const progressRef = ref(firebaseDatabase, `users/${userId}/progress`);
        
        // Set up the listener
        const unsubscribe = onValue(progressRef, (snapshot) => {
            if (snapshot.exists()) {
                const progressData = snapshot.val();
                console.log('🔄 Получено обновление прогресса:', progressData);
                callback(progressData);
            } else {
                // If no data exists, return empty progress
                callback({
                    games: {},
                    totalScore: 0,
                    gamesPlayed: 0,
                    levelsCompleted: 0
                });
            }
        }, (error) => {
            console.error('❌ Ошибка слушателя прогресса:', error);
        });
        
        console.log('✅ Слушатель прогресса установлен для пользователя:', userId);
        return unsubscribe;
    } catch (error) {
        console.error('❌ Ошибка установки слушателя:', error);
        return null;
    }
}

// Stop listening to progress updates
function stopListeningToProgress(unsubscribe) {
    if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
        console.log('✅ Слушатель прогресса отключен');
        return true;
    }
    return false;
}

// ========================================
// UI UPDATE FUNCTIONS
// ========================================

// Update UI based on auth state
function updateUIForAuth(isLoggedIn, user) {
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');
    const userNames = document.querySelectorAll('.user-name');
    const userAvatars = document.querySelectorAll('.user-avatar');
    
    if (isLoggedIn && user) {
        authButtons.forEach(el => el.style.display = 'none');
        userMenus.forEach(el => el.style.display = 'flex');
        userNames.forEach(el => el.textContent = user.displayName || 'Пользователь');
        
        // Get avatar from profile
        getUserProfile(user.uid).then(profile => {
            if (profile && profile.profile && profile.profile.avatar) {
                userAvatars.forEach(el => el.textContent = profile.profile.avatar);
            }
        });
    } else {
        authButtons.forEach(el => el.style.display = 'flex');
        userMenus.forEach(el => el.style.display = 'none');
    }
    
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isLoggedIn, user } }));
}

// ========================================
// LOCAL DATA (For development/demo without Firebase)
// ========================================

const localData = {
    // Encyclopedia data
    encyclopedia: {
        animals: [
            // === МЛЕКОПИТАЮЩИЕ ===
            {
                id: 'fox',
                name: 'Лисица',
                emoji: '🦊',
                category: 'animals',
                type: 'mammals',
                habitat: 'forest',
                typeName: 'Млекопитающее',
                habitatName: 'Лес',
                facts: [
                    'Лисица — очень умное и хитрое животное',
                    'Она может слышать мышку под снегом!',
                    'Лисы живут в норах, которые называются логова',
                    'Лисята рождаются слепыми и глухими',
                    'Лисица может бегать со скоростью до 50 км/ч'
                ]
            },
            {
                id: 'hedgehog',
                name: 'Ёжик',
                emoji: '🦔',
                category: 'animals',
                type: 'mammals',
                habitat: 'forest',
                typeName: 'Млекопитающее',
                habitatName: 'Лес',
                facts: [
                    'У ёжика около 5000 иголок на спине',
                    'Ёжики любят есть жуков и червяков',
                    'Зимой ёжики впадают в спячку',
                    'Ёжик может съесть до 200 насекомых за ночь',
                    'Иголки ёжика — это видоизменённые волосы'
                ]
            },
            {
                id: 'squirrel',
                name: 'Белка',
                emoji: '🐿️',
                category: 'animals',
                type: 'mammals',
                habitat: 'forest',
                typeName: 'Млекопитающее',
                habitatName: 'Лес',
                facts: [
                    'Белка делает запасы орехов на зиму',
                    'Хвост помогает белке держать равновесие',
                    'Белки могут прыгать на 10 метров!',
                    'Белка помнит, где спрятала до 3000 орехов',
                    'Зубы белки растут всю жизнь'
                ]
            },
            {
                id: 'rabbit',
                name: 'Заяц',
                emoji: '🐰',
                category: 'animals',
                type: 'mammals',
                habitat: 'field',
                typeName: 'Млекопитающее',
                habitatName: 'Поле',
                facts: [
                    'Заяц зимой становится белым',
                    'Уши зайца могут поворачиваться в разные стороны',
                    'Заяц может бегать со скоростью 70 км/ч',
                    'Зайцы спят с открытыми глазами',
                    'Заяц питается травой, корой и веточками'
                ]
            },
            {
                id: 'bear',
                name: 'Медведь',
                emoji: '🐻',
                category: 'animals',
                type: 'mammals',
                habitat: 'forest',
                typeName: 'Млекопитающее',
                habitatName: 'Лес',
                facts: [
                    'Медведь любит мёд и ягоды',
                    'Зимой медведь спит в берлоге',
                    'Медведь очень хорошо плавает',
                    'У медведя отличное обоняние',
                    'Медвежата рождаются очень маленькими'
                ]
            },
            // === ПТИЦЫ ===
            {
                id: 'owl',
                name: 'Сова',
                emoji: '🦉',
                category: 'animals',
                type: 'birds',
                habitat: 'forest',
                typeName: 'Птица',
                habitatName: 'Лес',
                facts: [
                    'Сова может поворачивать голову на 270 градусов',
                    'Совы охотятся ночью',
                    'У совы очень острый слух и зрение',
                    'Совы летают почти бесшумно',
                    'Глаза совы не двигаются, поэтому она вертит головой'
                ]
            },
            {
                id: 'stork',
                name: 'Аист',
                emoji: '🦩',
                category: 'animals',
                type: 'birds',
                habitat: 'field',
                typeName: 'Птица',
                habitatName: 'Поле',
                facts: [
                    'Аист — символ Беларуси',
                    'Аисты строят огромные гнёзда на крышах домов',
                    'Аисты питаются лягушками, рыбой и ящерицами',
                    'Каждый год аисты возвращаются в своё гнездо',
                    'Аист может пролететь до 10 000 км во время миграции'
                ]
            },
            {
                id: 'duck',
                name: 'Утка',
                emoji: '🦆',
                category: 'animals',
                type: 'birds',
                habitat: 'river',
                typeName: 'Птица',
                habitatName: 'Река',
                facts: [
                    'Утки отлично плавают и ныряют',
                    'Перья утки не промокают благодаря специальному жиру',
                    'Утята умеют плавать сразу после рождения',
                    'Утки крякают, а селезни издают свистящие звуки',
                    'Утки могут спать с одним открытым глазом'
                ]
            },
            {
                id: 'sparrow',
                name: 'Воробей',
                emoji: '🐦',
                category: 'animals',
                type: 'birds',
                habitat: 'field',
                typeName: 'Птица',
                habitatName: 'Город',
                facts: [
                    'Воробьи живут рядом с людьми уже тысячи лет',
                    'Воробей может прыгать, но не умеет ходить',
                    'Воробьи очень общительные птицы',
                    'Сердце воробья бьётся 800 раз в минуту',
                    'Воробьи купаются в пыли, чтобы очистить перья'
                ]
            },
            {
                id: 'woodpecker',
                name: 'Дятел',
                emoji: '🪶',
                category: 'animals',
                type: 'birds',
                habitat: 'forest',
                typeName: 'Птица',
                habitatName: 'Лес',
                facts: [
                    'Дятел стучит по дереву до 20 раз в секунду',
                    'Язык дятла может быть длиннее его тела',
                    'Дятел называется "лесным доктором"',
                    'Голова дятла защищена от сотрясений',
                    'Дятел достаёт жуков из-под коры деревьев'
                ]
            },
            // === РЫБЫ ===
            {
                id: 'pike',
                name: 'Щука',
                emoji: '🐟',
                category: 'animals',
                type: 'fish',
                habitat: 'river',
                typeName: 'Рыба',
                habitatName: 'Река',
                facts: [
                    'Щука — хищная рыба с острыми зубами',
                    'Щука может вырасти до 1,5 метра',
                    'Щука охотится из засады',
                    'У щуки около 700 зубов',
                    'Щука может прожить до 30 лет'
                ]
            },
            {
                id: 'carp',
                name: 'Карп',
                emoji: '🐠',
                category: 'animals',
                type: 'fish',
                habitat: 'river',
                typeName: 'Рыба',
                habitatName: 'Озеро',
                facts: [
                    'Карп — одна из самых умных рыб',
                    'Карп может жить до 50 лет',
                    'Карп любит тёплую воду',
                    'У карпа есть усики для поиска еды',
                    'Карп зимой впадает в спячку на дне озера'
                ]
            },
            {
                id: 'perch',
                name: 'Окунь',
                emoji: '🐡',
                category: 'animals',
                type: 'fish',
                habitat: 'river',
                typeName: 'Рыба',
                habitatName: 'Река',
                facts: [
                    'Окунь — полосатая рыба-хищник',
                    'Окуни живут стаями',
                    'У окуня острые плавники',
                    'Окунь охотится на мелкую рыбу',
                    'Окунь очень любопытная рыба'
                ]
            },
            // === НАСЕКОМЫЕ ===
            {
                id: 'butterfly',
                name: 'Бабочка',
                emoji: '🦋',
                category: 'animals',
                type: 'insects',
                habitat: 'field',
                typeName: 'Насекомое',
                habitatName: 'Поле',
                facts: [
                    'Бабочки пробуют еду лапками',
                    'Крылья бабочки покрыты крошечными чешуйками',
                    'Бабочка была гусеницей до превращения',
                    'Некоторые бабочки живут всего один день',
                    'Бабочки не могут летать, если им холодно'
                ]
            },
            {
                id: 'bee',
                name: 'Пчела',
                emoji: '🐝',
                category: 'animals',
                type: 'insects',
                habitat: 'field',
                typeName: 'Насекомое',
                habitatName: 'Поле',
                facts: [
                    'Пчёлы делают вкусный мёд',
                    'Пчела танцует, чтобы показать путь к цветам',
                    'В улье может жить до 60 000 пчёл',
                    'Пчёлы опыляют растения',
                    'Пчела машет крыльями 200 раз в секунду'
                ]
            },
            {
                id: 'ladybug',
                name: 'Божья коровка',
                emoji: '🐞',
                category: 'animals',
                type: 'insects',
                habitat: 'field',
                typeName: 'Насекомое',
                habitatName: 'Сад',
                facts: [
                    'Божья коровка приносит удачу по легендам',
                    'Она съедает много тли — вредителей растений',
                    'Точки на спине не показывают возраст',
                    'Божья коровка выделяет жёлтую жидкость для защиты',
                    'За жизнь божья коровка съедает 5000 тлей'
                ]
            },
            {
                id: 'dragonfly',
                name: 'Стрекоза',
                emoji: '🪰',
                category: 'animals',
                type: 'insects',
                habitat: 'river',
                typeName: 'Насекомое',
                habitatName: 'Пруд',
                facts: [
                    'Стрекоза — отличный охотник в воздухе',
                    'Глаза стрекозы видят почти на 360 градусов',
                    'Стрекоза может летать в любом направлении',
                    'Стрекозы жили ещё во времена динозавров',
                    'Стрекоза ловит добычу лапками в полёте'
                ]
            },
            {
                id: 'ant',
                name: 'Муравей',
                emoji: '🐜',
                category: 'animals',
                type: 'insects',
                habitat: 'forest',
                typeName: 'Насекомое',
                habitatName: 'Лес',
                facts: [
                    'Муравей может нести груз в 50 раз тяжелее себя',
                    'Муравьи живут большими семьями в муравейнике',
                    'У муравьёв есть королева, рабочие и солдаты',
                    'Муравьи общаются с помощью запахов',
                    'Муравьи никогда не спят'
                ]
            }
        ],
        plants: [
            // === ДЕРЕВЬЯ ===
            {
                id: 'oak',
                name: 'Дуб',
                emoji: '🌳',
                category: 'plants',
                type: 'trees',
                habitat: 'forest',
                typeName: 'Дерево',
                habitatName: 'Лес',
                facts: [
                    'Дуб может жить более 1000 лет',
                    'Из жёлудей вырастают новые дубы',
                    'Дубовая кора очень толстая и крепкая',
                    'Белки любят есть жёлуди',
                    'Дуб — символ силы и мудрости'
                ]
            },
            {
                id: 'pine',
                name: 'Сосна',
                emoji: '🌲',
                category: 'plants',
                type: 'trees',
                habitat: 'forest',
                typeName: 'Дерево',
                habitatName: 'Лес',
                facts: [
                    'Сосна остаётся зелёной круглый год',
                    'Из сосны делают скрипки и другие музыкальные инструменты',
                    'Сосна может жить более 500 лет',
                    'Шишки сосны содержат вкусные семена',
                    'Сосновый лес пахнет смолой'
                ]
            },
            {
                id: 'birch',
                name: 'Берёза',
                emoji: '🌳',
                category: 'plants',
                type: 'trees',
                habitat: 'forest',
                typeName: 'Дерево',
                habitatName: 'Лес',
                facts: [
                    'Берёза — символ России и Беларуси',
                    'Кора берёзы белого цвета',
                    'Весной из берёзы добывают сладкий сок',
                    'Берёзовые веники используют в бане',
                    'Берёза может вырасти до 30 метров'
                ]
            },
            // === ЦВЕТЫ ===
            {
                id: 'chamomile',
                name: 'Ромашка',
                emoji: '🌼',
                category: 'plants',
                type: 'flowers',
                habitat: 'field',
                typeName: 'Цветок',
                habitatName: 'Поле',
                facts: [
                    'Ромашка — лечебное растение',
                    'Из ромашки делают полезный чай',
                    'Пчёлы любят собирать нектар с ромашек',
                    'Ромашка цветёт всё лето',
                    'Лепестки ромашки белые, а серединка жёлтая'
                ]
            },
            {
                id: 'sunflower',
                name: 'Подсолнух',
                emoji: '🌻',
                category: 'plants',
                type: 'flowers',
                habitat: 'field',
                typeName: 'Цветок',
                habitatName: 'Поле',
                facts: [
                    'Подсолнух поворачивается к солнцу',
                    'Из семечек делают подсолнечное масло',
                    'Подсолнух может вырасти выше человека',
                    'Птицы любят есть семечки подсолнуха',
                    'Один подсолнух может дать 1000 семечек'
                ]
            },
            {
                id: 'lily',
                name: 'Кувшинка',
                emoji: '🪷',
                category: 'plants',
                type: 'flowers',
                habitat: 'river',
                typeName: 'Цветок',
                habitatName: 'Озеро',
                facts: [
                    'Кувшинка растёт в воде',
                    'Листья кувшинки плавают на поверхности',
                    'На листьях кувшинки любят сидеть лягушки',
                    'Цветы кувшинки открываются утром и закрываются вечером',
                    'Кувшинку называют "водяной розой"'
                ]
            },
            {
                id: 'cornflower',
                name: 'Василёк',
                emoji: '💙',
                category: 'plants',
                type: 'flowers',
                habitat: 'field',
                typeName: 'Цветок',
                habitatName: 'Поле',
                facts: [
                    'Василёк — символ верности и чистоты',
                    'Васильки растут среди пшеницы',
                    'Из васильков делают голубую краску',
                    'Пчёлы очень любят васильки',
                    'Василёк используют в народной медицине'
                ]
            },
            // === ТРАВЫ ===
            {
                id: 'clover',
                name: 'Клевер',
                emoji: '🍀',
                category: 'plants',
                type: 'herbs',
                habitat: 'field',
                typeName: 'Трава',
                habitatName: 'Луг',
                facts: [
                    'Четырёхлистный клевер приносит удачу',
                    'Клевер — любимая еда кроликов и коров',
                    'Пчёлы делают вкусный клеверный мёд',
                    'Клевер обогащает почву полезными веществами',
                    'Цветы клевера бывают белые, розовые и красные'
                ]
            },
            {
                id: 'fern',
                name: 'Папоротник',
                emoji: '🌿',
                category: 'plants',
                type: 'herbs',
                habitat: 'forest',
                typeName: 'Трава',
                habitatName: 'Лес',
                facts: [
                    'Папоротник — одно из древнейших растений',
                    'Папоротник не цветёт и не имеет семян',
                    'По легенде, цветок папоротника исполняет желания',
                    'Папоротники росли ещё при динозаврах',
                    'Папоротник любит тень и влагу'
                ]
            },
            {
                id: 'reed',
                name: 'Камыш',
                emoji: '🌾',
                category: 'plants',
                type: 'herbs',
                habitat: 'swamp',
                typeName: 'Трава',
                habitatName: 'Болото',
                facts: [
                    'Камыш растёт у воды на болотах и озёрах',
                    'Из камыша плетут корзины и коврики',
                    'В камышах прячутся утки и цапли',
                    'Камыш очищает воду от загрязнений',
                    'Камыш может вырасти до 4 метров'
                ]
            },
            {
                id: 'nettle',
                name: 'Крапива',
                emoji: '🌱',
                category: 'plants',
                type: 'herbs',
                habitat: 'forest',
                typeName: 'Трава',
                habitatName: 'Лес',
                facts: [
                    'Крапива жжётся, но очень полезная',
                    'Из крапивы варят вкусный суп',
                    'Крапива содержит много витаминов',
                    'Бабочки откладывают яйца на крапиве',
                    'Раньше из крапивы делали ткань'
                ]
            },
            {
                id: 'mint',
                name: 'Мята',
                emoji: '🌿',
                category: 'plants',
                type: 'herbs',
                habitat: 'field',
                typeName: 'Трава',
                habitatName: 'Сад',
                facts: [
                    'Мята очень вкусно пахнет',
                    'Из мяты делают чай и конфеты',
                    'Мята освежает дыхание',
                    'Мята отпугивает комаров',
                    'Мята растёт очень быстро'
                ]
            }
        ]
    },

    // Game data
    games: {
        findMe: {
            levels: [
                {
                    level: 1,
                    rounds: [
                        { target: '🦊', others: ['🐰', '🐻', '🦔', '🐿️'], targetName: 'лисичку' },
                        { target: '🦉', others: ['🐦', '🦆', '🐧', '🦅'], targetName: 'сову' },
                        { target: '🐿️', others: ['🐭', '🦔', '🐰', '🐹'], targetName: 'белочку' },
                        { target: '🌻', others: ['🌼', '🌸', '🌺', '🌷'], targetName: 'подсолнух' },
                        { target: '🌲', others: ['🌳', '🌴', '🎄', '🌵'], targetName: 'сосну' }
                    ]
                },
                {
                    level: 2,
                    rounds: [
                        { target: '🦔', others: ['🐿️', '🦫', '🦝', '🐭', '🐰'], targetName: 'ёжика' },
                        { target: '🐸', others: ['🐢', '🦎', '🐍', '🐊', '🦭'], targetName: 'лягушку' },
                        { target: '🦋', others: ['🐝', '🐞', '🦗', '🐛', '🦟'], targetName: 'бабочку' },
                        { target: '🍄', others: ['🌿', '🌱', '☘️', '🍀', '🪴'], targetName: 'гриб' },
                        { target: '🌸', others: ['🌺', '🌷', '🌹', '💐', '🪻'], targetName: 'сакуру' }
                    ]
                }
            ]
        },
        whoEats: {
            levels: [
                {
                    level: 1,
                    pairs: [
                        { animal: '🐿️', animalName: 'Белка', food: '🌰', foodName: 'Орехи' },
                        { animal: '🐰', animalName: 'Заяц', food: '🥕', foodName: 'Морковка' },
                        { animal: '🐻', animalName: 'Медведь', food: '🍯', foodName: 'Мёд' },
                        { animal: '🐟', animalName: 'Рыба', food: '🪱', foodName: 'Червячок' }
                    ]
                },
                {
                    level: 2,
                    pairs: [
                        { animal: '🦊', animalName: 'Лиса', food: '🐭', foodName: 'Мышка' },
                        { animal: '🦔', animalName: 'Ёжик', food: '🐛', foodName: 'Жучок' },
                        { animal: '🦉', animalName: 'Сова', food: '🐭', foodName: 'Мышка' },
                        { animal: '🐝', animalName: 'Пчела', food: '🌸', foodName: 'Цветок' },
                        { animal: '🐦', animalName: 'Птичка', food: '🌾', foodName: 'Зёрнышки' }
                    ]
                }
            ]
        },
        puzzle: {
            levels: [
                {
                    level: 1,
                    image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&h=600&fit=crop',
                    name: 'Лисичка',
                    gridSize: 3
                },
                {
                    level: 2,
                    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&h=600&fit=crop',
                    name: 'Сова',
                    gridSize: 3
                },
                {
                    level: 3,
                    image: 'https://images.unsplash.com/photo-1551799473-1b4a9e953ff7?w=600&h=600&fit=crop',
                    name: 'Ёжик',
                    gridSize: 3
                },
                {
                    level: 4,
                    image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=600&fit=crop',
                    name: 'Белка',
                    gridSize: 3
                },
                {
                    level: 5,
                    image: 'https://images.unsplash.com/photo-1568116344473-1a1e3e0b925b?w=600&h=600&fit=crop',
                    name: 'Зубр',
                    gridSize: 4
                },
                {
                    level: 6,
                    image: 'https://images.unsplash.com/photo-1533282960533-51328aa49826?w=600&h=600&fit=crop',
                    name: 'Олень',
                    gridSize: 4
                }
            ]
        },
        whoLives: {
            levels: [
                {
                    level: 1,
                    animals: [
                        { emoji: '🐻', name: 'Медведь', habitat: 'forest' },
                        { emoji: '🐟', name: 'Рыба', habitat: 'river' },
                        { emoji: '🐦', name: 'Птичка', habitat: 'sky' },
                        { emoji: '🐰', name: 'Заяц', habitat: 'field' }
                    ],
                    habitats: [
                        { id: 'forest', emoji: '🌲', name: 'Лес' },
                        { id: 'river', emoji: '🌊', name: 'Река' },
                        { id: 'sky', emoji: '☁️', name: 'Небо' },
                        { id: 'field', emoji: '🌾', name: 'Поле' }
                    ]
                },
                {
                    level: 2,
                    animals: [
                        { emoji: '🦊', name: 'Лисица', habitat: 'forest' },
                        { emoji: '🐸', name: 'Лягушка', habitat: 'swamp' },
                        { emoji: '🦉', name: 'Сова', habitat: 'forest' },
                        { emoji: '🦆', name: 'Утка', habitat: 'river' },
                        { emoji: '🐿️', name: 'Белка', habitat: 'forest' }
                    ],
                    habitats: [
                        { id: 'forest', emoji: '🌲', name: 'Лес' },
                        { id: 'river', emoji: '🌊', name: 'Река' },
                        { id: 'swamp', emoji: '🌿', name: 'Болото' },
                        { id: 'field', emoji: '🌾', name: 'Поле' }
                    ]
                }
            ]
        },
        truthMyth: {
            levels: [
                {
                    level: 1,
                    questions: [
                        { statement: 'Летучая мышь — это птица', answer: false, emoji: '🦇' },
                        { statement: 'Ёжик зимой спит', answer: true, emoji: '🦔' },
                        { statement: 'У паука 8 ног', answer: true, emoji: '🕷️' },
                        { statement: 'Кит — это рыба', answer: false, emoji: '🐋' },
                        { statement: 'Белка делает запасы на зиму', answer: true, emoji: '🐿️' }
                    ]
                },
                {
                    level: 2,
                    questions: [
                        { statement: 'Сова может поворачивать голову на 360 градусов', answer: false, emoji: '🦉' },
                        { statement: 'Подсолнух поворачивается к солнцу', answer: true, emoji: '🌻' },
                        { statement: 'Дельфин — это рыба', answer: false, emoji: '🐬' },
                        { statement: 'Зимой заяц становится белым', answer: true, emoji: '🐰' },
                        { statement: 'У осьминога 3 сердца', answer: true, emoji: '🐙' }
                    ]
                }
            ]
        }
    },

    // Map data - Маркеры на карте Беларуси
    mapMarkers: [
        // === ЖИВОТНЫЕ ===
        {
            id: 'bison',
            emoji: '🦬',
            name: 'Зубр',
            type: 'animal',
            position: { x: 22, y: 62 },
            facts: [
                'Зубр — самое крупное животное Беларуси',
                'Зубры живут в Беловежской пуще',
                'Зубр весит до 1 тонны!',
                'Зубр изображён на монетах Беларуси'
            ],
            habitat: 'Беловежская пуща'
        },
        {
            id: 'wolf',
            emoji: '🐺',
            name: 'Волк',
            type: 'animal',
            position: { x: 28, y: 55 },
            facts: [
                'Волки живут семьями — стаями',
                'Волк может пробежать 60 км за ночь',
                'Волки воют, чтобы общаться друг с другом'
            ],
            habitat: 'Беловежская пуща'
        },
        {
            id: 'elk',
            emoji: '🫎',
            name: 'Лось',
            type: 'animal',
            position: { x: 75, y: 28 },
            facts: [
                'Лось — самый крупный олень в мире',
                'Рога лося могут весить до 30 кг',
                'Лось отлично плавает и ныряет'
            ],
            habitat: 'Витебская область'
        },
        {
            id: 'stork',
            emoji: '🦩',
            name: 'Аист',
            type: 'animal',
            position: { x: 65, y: 22 },
            facts: [
                'Аист — символ Беларуси',
                'Аисты строят гнёзда на крышах домов',
                'Аисты возвращаются в своё гнездо каждый год'
            ],
            habitat: 'Витебская область'
        },
        {
            id: 'fox',
            emoji: '🦊',
            name: 'Лисица',
            type: 'animal',
            position: { x: 52, y: 42 },
            facts: [
                'Лисица очень хитрая и умная',
                'Лиса слышит мышей под снегом',
                'Лисята рождаются слепыми'
            ],
            habitat: 'Минская область'
        },
        {
            id: 'hedgehog',
            emoji: '🦔',
            name: 'Ёжик',
            type: 'animal',
            position: { x: 42, y: 48 },
            facts: [
                'У ёжика 5000 иголок на спине',
                'Ёжик съедает 200 насекомых за ночь',
                'Зимой ёжики спят в норках'
            ],
            habitat: 'Налибокская пуща'
        },
        {
            id: 'squirrel',
            emoji: '🐿️',
            name: 'Белка',
            type: 'animal',
            position: { x: 55, y: 32 },
            facts: [
                'Белка помнит 3000 мест с орехами',
                'Белка прыгает на 10 метров',
                'Хвост белки — её парашют'
            ],
            habitat: 'Березинский заповедник'
        },
        {
            id: 'beaver',
            emoji: '🦫',
            name: 'Бобр',
            type: 'animal',
            position: { x: 18, y: 38 },
            facts: [
                'Бобры строят плотины на реках',
                'Зубы бобра растут всю жизнь',
                'Бобр может не дышать 15 минут под водой'
            ],
            habitat: 'Река Неман'
        },
        {
            id: 'owl',
            emoji: '🦉',
            name: 'Сова',
            type: 'animal',
            position: { x: 25, y: 28 },
            facts: [
                'Сова видит в темноте',
                'Голова совы вращается на 270°',
                'Совы летают бесшумно'
            ],
            habitat: 'Гродненская область'
        },
        {
            id: 'boar',
            emoji: '🐗',
            name: 'Кабан',
            type: 'animal',
            position: { x: 82, y: 55 },
            facts: [
                'Кабан — дикий предок домашней свиньи',
                'Кабаны живут группами',
                'Клыки кабана растут всю жизнь'
            ],
            habitat: 'Могилёвская область'
        },
        {
            id: 'hare',
            emoji: '🐰',
            name: 'Заяц-беляк',
            type: 'animal',
            position: { x: 78, y: 42 },
            facts: [
                'Зимой заяц становится белым',
                'Заяц бегает со скоростью 70 км/ч',
                'Зайцы спят с открытыми глазами'
            ],
            habitat: 'Могилёвская область'
        },
        {
            id: 'crane',
            emoji: '🦢',
            name: 'Журавль',
            type: 'animal',
            position: { x: 62, y: 78 },
            facts: [
                'Журавли танцуют весной',
                'Журавли летят клином на юг',
                'Журавли живут парами всю жизнь'
            ],
            habitat: 'Полесье'
        },
        {
            id: 'pike',
            emoji: '🐟',
            name: 'Щука',
            type: 'animal',
            position: { x: 70, y: 65 },
            facts: [
                'Щука — хищная рыба Днепра',
                'У щуки 700 острых зубов',
                'Щука живёт до 30 лет'
            ],
            habitat: 'Река Днепр'
        },
        {
            id: 'frog',
            emoji: '🐸',
            name: 'Лягушка',
            type: 'animal',
            position: { x: 52, y: 72 },
            facts: [
                'Лягушки дышат через кожу',
                'Язык лягушки ловит мух за 0.07 секунды',
                'Лягушки квакают только самцы'
            ],
            habitat: 'Припятские болота'
        },
        {
            id: 'deer',
            emoji: '🦌',
            name: 'Олень',
            type: 'animal',
            position: { x: 15, y: 68 },
            facts: [
                'Олени сбрасывают рога каждый год',
                'Оленята рождаются с пятнышками',
                'Олень бегает со скоростью 55 км/ч'
            ],
            habitat: 'Брестская область'
        },
        {
            id: 'duck',
            emoji: '🦆',
            name: 'Утка',
            type: 'animal',
            position: { x: 38, y: 68 },
            facts: [
                'Утята плавают сразу после рождения',
                'Перья утки не промокают',
                'Утки могут спать одним глазом'
            ],
            habitat: 'Река Припять'
        },
        {
            id: 'bee',
            emoji: '🐝',
            name: 'Пчела',
            type: 'animal',
            position: { x: 35, y: 52 },
            facts: [
                'Пчёлы делают мёд из нектара',
                'Пчела танцует, показывая путь к цветам',
                'Белорусский мёд очень вкусный!'
            ],
            habitat: 'Минская область'
        },
        {
            id: 'butterfly',
            emoji: '🦋',
            name: 'Бабочка',
            type: 'animal',
            position: { x: 68, y: 48 },
            facts: [
                'Бабочка пробует еду лапками',
                'Бабочка была гусеницей',
                'В Беларуси живёт 2000 видов бабочек'
            ],
            habitat: 'Могилёвская область'
        },
        // === РАСТЕНИЯ ===
        {
            id: 'oak',
            emoji: '🌳',
            name: 'Дуб-великан',
            type: 'plant',
            position: { x: 18, y: 75 },
            facts: [
                'Царь-дубу в Беловежской пуще 600 лет',
                'Высота дуба — 46 метров',
                'Дуб — священное дерево славян'
            ],
            habitat: 'Беловежская пуща'
        },
        {
            id: 'birch',
            emoji: '🌳',
            name: 'Берёза',
            type: 'plant',
            position: { x: 58, y: 22 },
            facts: [
                'Берёза — символ Беларуси',
                'Весной берёза даёт сладкий сок',
                'Кора берёзы белого цвета'
            ],
            habitat: 'Витебская область'
        },
        {
            id: 'blueberry',
            emoji: '🫐',
            name: 'Черника',
            type: 'plant',
            position: { x: 80, y: 32 },
            facts: [
                'Черника растёт в белорусских лесах',
                'Черника полезна для зрения',
                'Ягоды черники красят язык в синий!'
            ],
            habitat: 'Березинский заповедник'
        },
        {
            id: 'pine',
            emoji: '🌲',
            name: 'Сосна',
            type: 'plant',
            position: { x: 48, y: 35 },
            facts: [
                'Сосновые леса — лёгкие Беларуси',
                'Сосна живёт 500 лет',
                'Воздух в сосновом лесу целебный'
            ],
            habitat: 'Минская область'
        },
        {
            id: 'chamomile',
            emoji: '🌼',
            name: 'Ромашка',
            type: 'plant',
            position: { x: 48, y: 55 },
            facts: [
                'Ромашка — лечебное растение',
                'Из ромашки делают чай',
                'Ромашка растёт на лугах Беларуси'
            ],
            habitat: 'Минская область'
        },
        {
            id: 'lily_valley',
            emoji: '🌸',
            name: 'Ландыш',
            type: 'plant',
            position: { x: 18, y: 25 },
            facts: [
                'Ландыш — символ весны',
                'Ландыш занесён в Красную книгу',
                'Ландыш очень душистый, но ядовитый!'
            ],
            habitat: 'Гродненская область'
        },
        {
            id: 'reed',
            emoji: '🌾',
            name: 'Камыш',
            type: 'plant',
            position: { x: 45, y: 78 },
            facts: [
                'Камыш растёт на болотах Полесья',
                'Из камыша плетут корзины',
                'В камышах живут птицы'
            ],
            habitat: 'Припятские болота'
        },
        {
            id: 'lily',
            emoji: '🪷',
            name: 'Кувшинка',
            type: 'plant',
            position: { x: 58, y: 68 },
            facts: [
                'Кувшинка — королева озёр',
                'Белая кувшинка в Красной книге',
                'Цветок открывается только днём'
            ],
            habitat: 'Озёра Полесья'
        },
        {
            id: 'fern',
            emoji: '🌿',
            name: 'Папоротник',
            type: 'plant',
            position: { x: 75, y: 52 },
            facts: [
                'По легенде, папоротник цветёт на Ивана Купалу',
                'Папоротник древнее динозавров',
                'Папоротник не имеет цветов'
            ],
            habitat: 'Могилёвская область'
        },
        {
            id: 'cranberry',
            emoji: '🔴',
            name: 'Клюква',
            type: 'plant',
            position: { x: 32, y: 72 },
            facts: [
                'Клюква растёт на болотах',
                'Клюква — витаминная ягода',
                'Клюкву собирают осенью'
            ],
            habitat: 'Брестские болота'
        },
        {
            id: 'waterlily',
            emoji: '💮',
            name: 'Белая лилия',
            type: 'plant',
            position: { x: 38, y: 28 },
            facts: [
                'Озеро Нарочь — самое большое в Беларуси',
                'Лилии украшают озёра',
                'Лилия — символ чистоты'
            ],
            habitat: 'Озеро Нарочь'
        },
        {
            id: 'mushroom',
            emoji: '🍄',
            name: 'Боровик',
            type: 'plant',
            position: { x: 30, y: 42 },
            facts: [
                'Боровик — король грибов',
                'Белорусы любят собирать грибы',
                'Боровик растёт под соснами и дубами'
            ],
            habitat: 'Налибокская пуща'
        },
        {
            id: 'clover',
            emoji: '🍀',
            name: 'Клевер',
            type: 'plant',
            position: { x: 72, y: 38 },
            facts: [
                '4-листный клевер приносит удачу',
                'Клевер — пища для пчёл',
                'Клевер растёт на лугах Беларуси'
            ],
            habitat: 'Могилёвская область'
        }
    ]
};

// ========================================
// DATABASE HELPER FUNCTIONS
// ========================================

class Database {
    constructor() {
        this.useLocalData = true; // Will be set to false when Firebase is ready
    }

    // Get all encyclopedia items
    async getEncyclopedia() {
        if (this.useLocalData) {
            return [...localData.encyclopedia.animals, ...localData.encyclopedia.plants];
        }
        // Firebase implementation - could be added later
        return [...localData.encyclopedia.animals, ...localData.encyclopedia.plants];
    }

    // Get game data
    async getGameData(gameName) {
        if (this.useLocalData) {
            return localData.games[gameName];
        }
        return localData.games[gameName];
    }

    // Get map markers
    async getMapMarkers() {
        if (this.useLocalData) {
            return localData.mapMarkers;
        }
        return localData.mapMarkers;
    }

    // Search encyclopedia
    async searchEncyclopedia(query) {
        const items = await this.getEncyclopedia();
        const lowerQuery = query.toLowerCase();
        return items.filter(item => 
            item.name.toLowerCase().includes(lowerQuery)
        );
    }

    // Filter encyclopedia
    async filterEncyclopedia(category, type, habitat) {
        let items = await this.getEncyclopedia();
        
        if (category && category !== 'all') {
            items = items.filter(item => item.category === category);
        }
        if (type && type !== 'all') {
            items = items.filter(item => item.type === type);
        }
        if (habitat && habitat !== 'all') {
            items = items.filter(item => item.habitat === habitat);
        }
        
        return items;
    }
}

// Global database instance
const db = new Database();
window.db = db; // Make db globally accessible for debugging

// Export Firebase functions globally for use in other scripts
window.saveGameProgress = saveGameProgress;
window.getGameProgressFromFirebase = getGameProgressFromFirebase;
window.getAllProgressStats = getAllProgressStats;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.listenToProgressUpdates = listenToProgressUpdates;
window.stopListeningToProgress = stopListeningToProgress;

console.log('✅ Firebase конфигурация загружена');

// ========================================
// INITIALIZE FIREBASE ON LOAD
// ========================================

// Initialize Firebase when the script loads
initializeFirebase();

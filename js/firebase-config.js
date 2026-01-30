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

    if (typeof email === 'string' && email !== email.trim()) {
        return { success: false, error: 'Email не должен содержать пробелов' };
    }

    const normalizedEmail = typeof email === 'string' ? email.trim() : email;

    try {
        const { createUserWithEmailAndPassword, updateProfile } = window.firebaseMethods;

        // Create user
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, { displayName: displayName });
        
        // Create user profile in database
        await createUserProfile(user.uid, {
            displayName: displayName,
            email: normalizedEmail,
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

    if (typeof email === 'string' && email !== email.trim()) {
        return { success: false, error: 'Email не должен содержать пробелов' };
    }

    const normalizedEmail = typeof email === 'string' ? email.trim() : email;

    try {
        const { signInWithEmailAndPassword } = window.firebaseMethods;
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
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

function getLocalAggregatedProgress() {
    try {
        const raw = localStorage.getItem('overall_progress');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        return {
            totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
            gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0
        };
    } catch (error) {
        console.error('❌ Ошибка чтения overall_progress из localStorage:', error);
        return null;
    }
}

function updateLocalAggregatedProgress({ scoreDelta = 0, gamesPlayedDelta = 0 } = {}) {
    const current = getLocalAggregatedProgress() || { totalScore: 0, gamesPlayed: 0 };

    const updated = {
        totalScore: current.totalScore + (Number(scoreDelta) || 0),
        gamesPlayed: current.gamesPlayed + (Number(gamesPlayedDelta) || 0)
    };

    try {
        localStorage.setItem('overall_progress', JSON.stringify(updated));
    } catch (error) {
        console.error('❌ Ошибка сохранения overall_progress в localStorage:', error);
    }

    return updated;
}

// Save game progress to Firebase
async function saveGameProgress(gameName, level, score, completed = true) {
    const numericScore = Number(score) || 0;
    const numericLevel = Number(level) || 1;

    const user = getCurrentUser();
    if (!user) {
        console.log('⚠️ Пользователь не авторизован, сохранение в localStorage');

        if (typeof gameProgress !== 'undefined' && typeof gameProgress.saveProgress === 'function') {
            gameProgress.saveProgress(gameName, numericLevel, numericScore);
        }

        if (completed) {
            updateLocalAggregatedProgress({ scoreDelta: numericScore, gamesPlayedDelta: 1 });
        }

        return true;
    }

    // Wait for Firebase to be ready
    try {
        await waitForFirebase();
    } catch (error) {
        console.error('❌ Ошибка ожидания Firebase:', error);

        if (typeof gameProgress !== 'undefined' && typeof gameProgress.saveProgress === 'function') {
            gameProgress.saveProgress(gameName, numericLevel, numericScore);
        }
        if (completed) {
            updateLocalAggregatedProgress({ scoreDelta: numericScore, gamesPlayedDelta: 1 });
        }

        return false;
    }

    // Check if Firebase is initialized
    if (!window.firebaseMethods || !firebaseDatabase) {
        console.error('❌ Firebase не инициализирован при попытке сохранить прогресс');

        if (typeof gameProgress !== 'undefined' && typeof gameProgress.saveProgress === 'function') {
            gameProgress.saveProgress(gameName, numericLevel, numericScore);
        }
        if (completed) {
            updateLocalAggregatedProgress({ scoreDelta: numericScore, gamesPlayedDelta: 1 });
        }

        return false;
    }

    try {
        const { ref, get, set } = window.firebaseMethods;
        const userId = user.uid;
        console.log('💾 Сохранение прогресса:', { gameName, level: numericLevel, score: numericScore, completed, userId });

        const progressRef = ref(firebaseDatabase, `users/${userId}/progress`);
        const snapshot = await get(progressRef);

        let progress = snapshot.exists() ? snapshot.val() : null;
        if (!progress || typeof progress !== 'object') {
            progress = {
                games: {},
                totalScore: 0,
                gamesPlayed: 0,
                levelsCompleted: 0
            };
        }

        if (!progress.games || typeof progress.games !== 'object') {
            progress.games = {};
        }

        progress.totalScore = Number(progress.totalScore) || 0;
        progress.gamesPlayed = Number(progress.gamesPlayed) || 0;
        progress.levelsCompleted = Number(progress.levelsCompleted) || 0;

        if (!progress.games[gameName] || typeof progress.games[gameName] !== 'object') {
            progress.games[gameName] = {
                completedLevels: [],
                highScores: {},
                lastPlayed: null
            };
        }

        const gameData = progress.games[gameName];

        if (!Array.isArray(gameData.completedLevels)) {
            gameData.completedLevels = [];
        }
        if (!gameData.highScores || typeof gameData.highScores !== 'object') {
            gameData.highScores = {};
        }

        const levelAlreadyCompleted = gameData.completedLevels.includes(numericLevel) ||
            gameData.completedLevels.includes(String(numericLevel));

        if (completed && !levelAlreadyCompleted) {
            gameData.completedLevels.push(numericLevel);
            progress.levelsCompleted += 1;
        }

        if (completed) {
            progress.gamesPlayed += 1;
            progress.totalScore += numericScore;
            updateLocalAggregatedProgress({ scoreDelta: numericScore, gamesPlayedDelta: 1 });
        }

        const currentHighScore = Number(gameData.highScores[numericLevel]) || 0;
        if (numericScore > currentHighScore) {
            gameData.highScores[numericLevel] = numericScore;
        }

        gameData.lastPlayed = new Date().toISOString();

        await set(progressRef, progress);

        if (typeof gameProgress !== 'undefined' && typeof gameProgress.saveProgress === 'function') {
            gameProgress.saveProgress(gameName, numericLevel, numericScore);
        }

        console.log('✅ Прогресс сохранён в Firebase:', { gameName, level: numericLevel, score: numericScore, completed });
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения прогресса в Firebase:', error);
        console.error('Детали ошибки:', {
            gameName,
            level: numericLevel,
            score: numericScore,
            completed,
            errorMessage: error.message,
            errorCode: error.code
        });

        if (typeof gameProgress !== 'undefined' && typeof gameProgress.saveProgress === 'function') {
            gameProgress.saveProgress(gameName, numericLevel, numericScore);
        }
        if (completed) {
            updateLocalAggregatedProgress({ scoreDelta: numericScore, gamesPlayedDelta: 1 });
        }

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
            const stats = snapshot.val() || {};

            if (!stats.games || typeof stats.games !== 'object') {
                stats.games = {};
            }

            stats.totalScore = Number(stats.totalScore) || 0;
            stats.gamesPlayed = Number(stats.gamesPlayed) || 0;
            stats.levelsCompleted = Number(stats.levelsCompleted) || 0;

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
    let fallbackTotalScore = 0;
    let levelsCompleted = 0;
    const gamesProgress = {};

    games.forEach(game => {
        const progress = gameProgress.getProgress(game);
        gamesProgress[game] = progress;
        levelsCompleted += progress.completedLevels.length;

        Object.values(progress.highScores).forEach(score => {
            fallbackTotalScore += score;
        });
    });

    const fallbackGamesPlayed = Object.values(gamesProgress).filter(g =>
        g.completedLevels && g.completedLevels.length > 0
    ).length;

    const overall = getLocalAggregatedProgress();

    return {
        games: gamesProgress,
        totalScore: overall ? overall.totalScore : fallbackTotalScore,
        gamesPlayed: overall ? overall.gamesPlayed : fallbackGamesPlayed,
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
                name: 'Лебедь',
                emoji: '🦢',
                category: 'animals',
                type: 'birds',
                habitat: 'field',
                typeName: 'Птица',
                habitatName: 'Поле',
                facts: [
                    'Лебедь — символ красоты и грации.',
                    'Лебеди строят свои гнёзда на берегах озёр и рек.',
                    'Лебеди питаются водорослями, мелкой рыбой и насекомыми.',
                    'Каждый год лебеди возвращаются на свои любимые места гнездования.',
                    'Лебедь может пролететь тысячи километров во время миграции.'
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
                emoji: '🐦‍⬛',
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
                name: 'Черепаха болотная',
                emoji: '🐢',
                category: 'animals',
                type: 'fish',
                habitat: 'river',
                typeName: 'Рыба',
                habitatName: 'Река',
               facts: [
    'Черепаха болотная — пресноводное рептилия',
    'Черепахи болотные обитает в болотах и водоёмах',
    'У черепахи болотной тёмный панцирь',
    'Черепаха болотная питается водными растениями и мелкими животными',
    'Черепахи болотные могут долго находиться под водой'
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
                name: 'Муха',
                emoji: '🪰',
                category: 'animals',
                type: 'insects',
                habitat: 'river',
                typeName: 'Насекомое',
                habitatName: 'Пруд',
            facts: [
    'Муха — универсальный насекомое, встречающееся повсюду',
    'Глаза мухи состоят из тысяч фасеток, обеспечивая широкий угол обзора',
    'Муха может быстро менять направление полёта',
    'Муравьи жили на Земле более 400 миллионов лет назад',
    'Муха ловит добычу своими крыльями, притягивая к себе'
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
                },
                {
                    level: 3,
                    rounds: [
                        { target: '🦬', others: ['🐂', '🐃', '🦛', '🐘', '🦏'], targetName: 'зубра' },
                        { target: '🦫', others: ['🦦', '🦭', '🐿️', '🦔', '🐀'], targetName: 'бобра' },
                        { target: '🦢', others: ['🦆', '🦩', '🪿', '🐓', '🦚'], targetName: 'лебедя' },
                        { target: '🪺', others: ['🥚', '🐣', '🐥', '🪹', '🐦'], targetName: 'гнездо' },
                        { target: '🌾', others: ['🌿', '🍀', '🌱', '☘️', '🪴'], targetName: 'камыш' }
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
                        { animal: '🦊', animalName: 'Лиса', food: '🐔', foodName: 'Курочка' },
                        { animal: '🦔', animalName: 'Ёжик', food: '🐛', foodName: 'Жучок' },
                        { animal: '🦉', animalName: 'Сова', food: '🐭', foodName: 'Мышка' },
                        { animal: '🐝', animalName: 'Пчела', food: '🌸', foodName: 'Цветок' },
                        { animal: '🐦', animalName: 'Птичка', food: '🌾', foodName: 'Зёрнышки' }
                    ]
                },
                {
                    level: 3,
                    pairs: [
                        { animal: '🦫', animalName: 'Бобр', food: '🪵', foodName: 'Кора дерева' },
                        { animal: '🐸', animalName: 'Лягушка', food: '🪰', foodName: 'Мошки' },
                        { animal: '🦢', animalName: 'Лебедь', food: '🌿', foodName: 'Водоросли' },
                        { animal: '🐺', animalName: 'Волк', food: '🥩', foodName: 'Мясо' },
                        { animal: '🦋', animalName: 'Бабочка', food: '🧃', foodName: 'Нектар' },
                        { animal: '🐿️', animalName: 'Белка', food: '🍄', foodName: 'Грибы' }
                    ]
                }
            ]
        },
        puzzle: {
            levels: [
                {
                    level: 1,
                    image: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=600&h=600&fit=crop',
                    name: 'Сова',
                    gridSize: 3
                },
                {
                    level: 2,
<<<<<<< HEAD
                    image: 'https://images.unsplash.com/photo-1644125003076-ce465d331769?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    name: 'Лиса',
=======
<<<<<<< HEAD
                    image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&h=600&fit=crop',
                    name: 'Бургер',
=======
                    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUAL8kJjLhI_rnsLxe-lxh8RWdREQIUE0XxQ&s',
                    name: 'Сова',
>>>>>>> 8bbba0aacff4faab10dde3a78437f4961864e9f7
>>>>>>> 68169de7676e533256e8347b2da926f6ede8b7c8
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
                    gridSize: 3
                },
                {
                    level: 6,
                    image: 'https://images.unsplash.com/photo-1533282960533-51328aa49826?w=600&h=600&fit=crop',
                    name: 'Олень',
                    gridSize: 3
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
                },
                {
                    level: 3,
                    animals: [
                        { emoji: '🦬', name: 'Зубр', habitat: 'forest' },
                        { emoji: '🦫', name: 'Бобр', habitat: 'river' },
                        { emoji: '🦢', name: 'Лебедь', habitat: 'river' },
                        { emoji: '🐺', name: 'Волк', habitat: 'forest' },
                        { emoji: '🦔', name: 'Ёжик', habitat: 'forest' },
                        { emoji: '🐝', name: 'Пчела', habitat: 'field' }
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
                },
                {
                    level: 3,
                    questions: [
                        { statement: 'Крокодил может жить более 100 лет', answer: true, emoji: '🐊' },
                        { statement: 'Страус прячет голову в песок от страха', answer: false, emoji: '🦃' },
                        { statement: 'Муравьи никогда не спят', answer: true, emoji: '🐜' },
                        { statement: 'У жирафа такое же количество шейных позвонков, как у человека', answer: true, emoji: '🦒' },
                        { statement: 'Пингвины живут только в Антарктиде', answer: false, emoji: '🐧' }
                    ]
                }
            ]
        },
        whoSays: {
            levels: [
                {
                    level: 1,
                    rounds: [
                        {
                            correctAnimal: 'dog',
                            soundUrl: 'https://www.soundjay.com/animal/dog-barking-01.mp3',
                            soundText: 'Гав гав гав!',
                            options: [
                                { id: 'dog', name: 'Собака', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
                                { id: 'cat', name: 'Кошка', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop' },
                                { id: 'cow', name: 'Корова', image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'cat',
                            soundUrl: 'https://www.soundjay.com/animal/cat-meow-01.mp3',
                            soundText: 'Мяу мяу!',
                            options: [
                                { id: 'dog', name: 'Собака', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
                                { id: 'cat', name: 'Кошка', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop' },
                                { id: 'bird', name: 'Птичка', image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'cow',
                            soundUrl: 'https://www.soundjay.com/animal/cow-moo-01.mp3',
                            soundText: 'Муууу!',
                            options: [
                                { id: 'pig', name: 'Свинья', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=200&h=200&fit=crop' },
                                { id: 'cow', name: 'Корова', image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=200&h=200&fit=crop' },
                                { id: 'horse', name: 'Лошадь', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'rooster',
                            soundUrl: 'https://www.soundjay.com/animal/rooster-crow-01.mp3',
                            soundText: 'Кукареку!',
                            options: [
                                { id: 'duck', name: 'Утка', image: 'https://images.unsplash.com/photo-1459682687441-7761439a709d?w=200&h=200&fit=crop' },
                                { id: 'rooster', name: 'Петух', image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200&h=200&fit=crop' },
                                { id: 'owl', name: 'Сова', image: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'sheep',
                            soundUrl: 'https://www.soundjay.com/animal/sheep-baa-01.mp3',
                            soundText: 'Беее!',
                            options: [
                                { id: 'sheep', name: 'Овечка', image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=200&h=200&fit=crop' },
                                { id: 'goat', name: 'Коза', image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=200&h=200&fit=crop' },
                                { id: 'pig', name: 'Свинья', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=200&h=200&fit=crop' }
                            ]
                        }
                    ]
                },
                {
                    level: 2,
                    rounds: [
                        {
                            correctAnimal: 'wolf',
                            soundUrl: 'https://www.soundjay.com/animal/wolf-howl-01.mp3',
                            soundText: 'Ауууу!',
                            options: [
                                { id: 'wolf', name: 'Волк', image: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=200&h=200&fit=crop' },
                                { id: 'dog', name: 'Собака', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
                                { id: 'fox', name: 'Лиса', image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=200&h=200&fit=crop' },
                                { id: 'bear', name: 'Медведь', image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'owl',
                            soundUrl: 'https://www.soundjay.com/animal/owl-hoot-01.mp3',
                            soundText: 'Угуууу!',
                            options: [
                                { id: 'crow', name: 'Ворона', image: 'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=200&h=200&fit=crop' },
                                { id: 'owl', name: 'Сова', image: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=200&h=200&fit=crop' },
                                { id: 'eagle', name: 'Орёл', image: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=200&h=200&fit=crop' },
                                { id: 'parrot', name: 'Попугай', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'frog',
                            soundUrl: 'https://www.soundjay.com/animal/frog-croaking-01.mp3',
                            soundText: 'Ква ква!',
                            options: [
                                { id: 'snake', name: 'Змея', image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=200&h=200&fit=crop' },
                                { id: 'turtle', name: 'Черепаха', image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=200&h=200&fit=crop' },
                                { id: 'frog', name: 'Лягушка', image: 'https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=200&h=200&fit=crop' },
                                { id: 'fish', name: 'Рыба', image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'lion',
                            soundUrl: 'https://www.soundjay.com/animal/lion-roar-01.mp3',
                            soundText: 'Рррр!',
                            options: [
                                { id: 'lion', name: 'Лев', image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&h=200&fit=crop' },
                                { id: 'tiger', name: 'Тигр', image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&h=200&fit=crop' },
                                { id: 'bear', name: 'Медведь', image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=200&h=200&fit=crop' },
                                { id: 'wolf', name: 'Волк', image: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'duck',
                            soundUrl: 'https://www.soundjay.com/animal/duck-quack-01.mp3',
                            soundText: 'Кря кря!',
                            options: [
                                { id: 'goose', name: 'Гусь', image: 'https://images.unsplash.com/photo-1562008939-f41e09aa8a7b?w=200&h=200&fit=crop' },
                                { id: 'duck', name: 'Утка', image: 'https://images.unsplash.com/photo-1459682687441-7761439a709d?w=200&h=200&fit=crop' },
                                { id: 'swan', name: 'Лебедь', image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=200&h=200&fit=crop' },
                                { id: 'rooster', name: 'Петух', image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200&h=200&fit=crop' }
                            ]
                        }
                    ]
                },
                {
                    level: 3,
                    rounds: [
                        {
                            correctAnimal: 'elephant',
                            soundUrl: 'https://www.soundjay.com/animal/elephant-trumpeting-01.mp3',
                            soundText: 'Туууу!',
                            options: [
                                { id: 'elephant', name: 'Слон', image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=200&h=200&fit=crop' },
                                { id: 'rhino', name: 'Носорог', image: 'https://images.unsplash.com/photo-1598894000329-0041c4a10d55?w=200&h=200&fit=crop' },
                                { id: 'hippo', name: 'Бегемот', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop' },
                                { id: 'giraffe', name: 'Жираф', image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'monkey',
                            soundUrl: 'https://www.soundjay.com/animal/monkey-scream-01.mp3',
                            soundText: 'У-у-у а-а-а!',
                            options: [
                                { id: 'monkey', name: 'Обезьяна', image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=200&h=200&fit=crop' },
                                { id: 'gorilla', name: 'Горилла', image: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=200&h=200&fit=crop' },
                                { id: 'lemur', name: 'Лемур', image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=200&h=200&fit=crop' },
                                { id: 'sloth', name: 'Ленивец', image: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'horse',
                            soundUrl: 'https://www.soundjay.com/animal/horse-neigh-01.mp3',
                            soundText: 'Иго-го!',
                            options: [
                                { id: 'donkey', name: 'Осёл', image: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=200&h=200&fit=crop' },
                                { id: 'horse', name: 'Лошадь', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=200&h=200&fit=crop' },
                                { id: 'zebra', name: 'Зебра', image: 'https://images.unsplash.com/photo-1526095179574-86e545f5e8e4?w=200&h=200&fit=crop' },
                                { id: 'deer', name: 'Олень', image: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'bee',
                            soundUrl: 'https://www.soundjay.com/animal/bee-buzzing-01.mp3',
                            soundText: 'Жжжж!',
                            options: [
                                { id: 'bee', name: 'Пчела', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200&h=200&fit=crop' },
                                { id: 'fly', name: 'Муха', image: 'https://images.unsplash.com/photo-1558430665-6ddd08021896?w=200&h=200&fit=crop' },
                                { id: 'butterfly', name: 'Бабочка', image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=200&h=200&fit=crop' },
                                { id: 'mosquito', name: 'Комар', image: 'https://images.unsplash.com/photo-1562569633-622303bafef5?w=200&h=200&fit=crop' }
                            ]
                        },
                        {
                            correctAnimal: 'crow',
                            soundUrl: 'https://www.soundjay.com/animal/crow-caw-01.mp3',
                            soundText: 'Кар кар!',
                            options: [
                                { id: 'crow', name: 'Ворона', image: 'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=200&h=200&fit=crop' },
                                { id: 'sparrow', name: 'Воробей', image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=200&h=200&fit=crop' },
                                { id: 'pigeon', name: 'Голубь', image: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=200&h=200&fit=crop' },
                                { id: 'magpie', name: 'Сорока', image: 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=200&h=200&fit=crop' }
                            ]
                        }
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
            emoji: '🦢',
            name: 'Лебедь',
            type: 'animal',
            position: { x: 65, y: 22 },
            facts: [
                'Лебедь — символ чистоты и красоты.',
                'Лебеди строят гнёзда на берегах водоёмов.',
                'Лебеди возвращаются на свои гнёзда каждый год.'
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
            name: 'Мухомор',
            type: 'plant',
            position: { x: 30, y: 42 },
            facts: [
                'Мухомор — загадочный гриб.',
                'Белорусы также интересуются мухоморами, изучая их красоту и свойства.',
                'Мухомор часто встречается в лесах среди сосен и берёз.'
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

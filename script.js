/**
 * Ezan Vakitleri - Ana JavaScript Dosyası
 * Diyanet API Entegrasyonu, Şehir Seçimi, Geri Sayım
 */

// ============================================
// TÜRKİYE ŞEHİRLERİ LİSTESİ
// ============================================
const turkiyeSehirleri = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay",
    "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli",
    "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş",
    "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya",
    "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli",
    "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük",
    "Kilis", "Osmaniye", "Düzce"
];

// ============================================
// GLOBAL DEĞİŞKENLER
// ============================================
let currentPrayerTimes = null;
let countdownInterval = null;
let selectedCity = "";

// ============================================
// DOM ELEMENTLERİ
// ============================================
const elements = {
    citySelect: document.getElementById('citySelect'),
    quickCities: document.querySelectorAll('.quick-city'),
    loading: document.getElementById('loading'),
    infoBar: document.getElementById('infoBar'),
    prayerTimes: document.getElementById('prayerTimes'),
    countdownSection: document.getElementById('countdownSection'),
    currentDate: document.getElementById('currentDate'),
    selectedCity: document.getElementById('selectedCity'),
    hijriDate: document.getElementById('hijriDate'),
    nextPrayerName: document.getElementById('nextPrayerName'),
    countdownHours: document.getElementById('countdownHours'),
    countdownMinutes: document.getElementById('countdownMinutes'),
    countdownSeconds: document.getElementById('countdownSeconds'),
    timeCards: document.querySelectorAll('.time-card')
};

// ============================================
// BAŞLATMA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCitySelect();
    initQuickCities();
    loadTodayDate();
    
    // Son seçili şehri kontrol et
    const lastCity = localStorage.getItem('selectedCity');
    if (lastCity) {
        elements.citySelect.value = lastCity;
        loadPrayerTimes(lastCity);
    }
});

// ============================================
// ŞEHİR SEÇİMİ BAŞLATMA
// ============================================
function initCitySelect() {
    // Şehirleri dropdown'a ekle
    turkiyeSehirleri.forEach(sehir => {
        const option = document.createElement('option');
        option.value = sehir;
        option.textContent = sehir;
        elements.citySelect.appendChild(option);
    });

    // Şehir değişim olayını dinle
    elements.citySelect.addEventListener('change', (e) => {
        const city = e.target.value;
        if (city) {
            localStorage.setItem('selectedCity', city);
            loadPrayerTimes(city);
        }
    });
}

// ============================================
// HIZLI ŞEHİR BUTONLARI
// ============================================
function initQuickCities() {
    elements.quickCities.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.dataset.city;
            elements.citySelect.value = city;
            localStorage.setItem('selectedCity', city);
            loadPrayerTimes(city);
        });
    });
}

// ============================================
// TARİH BİLGİLERİNİ YÜKLE
// ============================================
function loadTodayDate() {
    const now = new Date();
    
    // Miladi tarih
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    elements.currentDate.textContent = now.toLocaleDateString('tr-TR', options);
    
    // Hicri tarih (yaklaşık hesaplama)
    const hijriDate = getHijriDate(now);
    elements.hijriDate.textContent = hijriDate;
}

// ============================================
// HİCRİ TARİH HESAPLAMA
// ============================================
function getHijriDate(date) {
    const hijriMonths = [
        "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir",
        "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban",
        "Ramazan", "Şevval", "Zilkade", "Zilhicce"
    ];
    
    // Basit yaklaşık hesaplama
    const hijriYear = Math.floor((date.getTime() - new Date(622, 6, 16).getTime()) / (354.367 * 24 * 60 * 60 * 1000)) + 1;
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const hijriDay = ((dayOfYear % 354) % 30) || 30;
    const hijriMonthIndex = Math.floor((dayOfYear % 354) / 30) % 12;
    
    return `${hijriDay} ${hijriMonths[hijriMonthIndex]} ${hijriYear}`;
}

// ============================================
// EZAN VAKİTLERİNİ YÜKLE
// ============================================
async function loadPrayerTimes(city) {
    selectedCity = city;
    elements.selectedCity.textContent = city;
    
    // Yükleme göster
    showLoading();
    
    try {
        // Diyanet API'sinden veri çek
        const times = await fetchPrayerTimesFromDiyanet(city);
        currentPrayerTimes = times;
        
        // Vakitleri göster
        displayPrayerTimes(times);
        
        // Geri sayımı başlat
        startCountdown(times);
        
        // Bilgi çubuğunu göster
        elements.infoBar.style.display = 'flex';
        elements.prayerTimes.style.display = 'block';
        elements.countdownSection.style.display = 'block';
        
    } catch (error) {
        console.error('Vakitler yüklenirken hata:', error);
        // Hata durumunda örnek veriler göster
        showSampleData();
    } finally {
        hideLoading();
    }
}

// ============================================
// DİYANET API'DEN VERİ ÇEK
// ============================================
async function fetchPrayerTimesFromDiyanet(city) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Diyanet API endpoint
    const url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(city)}&country=Turkey&method=13`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 200 && data.data && data.data.timings) {
            const timings = data.data.timings;
            return {
                imsak: formatTime(timings.Imsak),
                sabah: formatTime(timings.Fajr),
                ogle: formatTime(timings.Dhuhr),
                ikindi: formatTime(timings.Asr),
                aksam: formatTime(timings.Maghrib),
                yatsi: formatTime(timings.Isha),
                raw: timings
            };
        }
        throw new Error('API yanıtı geçersiz');
    } catch (error) {
        // Yedek API dene
        return fetchFromBackupAPI(city);
    }
}

// ============================================
// YEDEK API'DEN VERİ ÇEK
// ============================================
async function fetchFromBackupAPI(city) {
    try {
        const response = await fetch(`https://dailyprayer.abdulrcs.repl.co/api/${city}`);
        const data = await response.json();
        
        if (data && data.data && data.data.timings) {
            const t = data.data.timings;
            return {
                imsak: formatTime(t.Imsak),
                sabah: formatTime(t.Fajr),
                ogle: formatTime(t.Dhuhr),
                ikindi: formatTime(t.Asr),
                aksam: formatTime(t.Maghrib),
                yatsi: formatTime(t.Isha),
                raw: t
            };
        }
    } catch (e) {
        console.log('Yedek API de başarısız, örnek veriler kullanılıyor');
    }
    
    return getSamplePrayerTimes();
}

// ============================================
// SAAT FORMATLA
// ============================================
function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    // 24 saat formatını koru
    return timeStr.substring(0, 5);
}

// ============================================
// ÖRNEK VERİLER (API HATASI DURUMUNDA)
// ============================================
function getSamplePrayerTimes() {
    return {
        imsak: '05:45',
        sabah: '06:05',
        ogle: '13:15',
        ikindi: '16:45',
        aksam: '19:45',
        yatsi: '21:15'
    };
}

function showSampleData() {
    const sample = getSamplePrayerTimes();
    displayPrayerTimes(sample);
    startCountdown(sample);
    elements.infoBar.style.display = 'flex';
    elements.prayerTimes.style.display = 'block';
    elements.countdownSection.style.display = 'block';
}

// ============================================
// EZAN VAKİTLERİNİ GÖSTER
// ============================================
function displayPrayerTimes(times) {
    document.getElementById('imsakTime').textContent = times.imsak;
    document.getElementById('sabahTime').textContent = times.sabah;
    document.getElementById('ogleTime').textContent = times.ogle;
    document.getElementById('ikindiTime').textContent = times.ikindi;
    document.getElementById('aksamTime').textContent = times.aksam;
    document.getElementById('yatsiTime').textContent = times.yatsi;
    
    // Aktif vakti işaretle
    highlightCurrentPrayer(times);
}

// ============================================
// GÜNCEL VAKİTİ İŞARETLE
// ============================================
function highlightCurrentPrayer(times) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
        { name: 'imsak', time: timeToMinutes(times.imsak) },
        { name: 'sabah', time: timeToMinutes(times.sabah) },
        { name: 'ogle', time: timeToMinutes(times.ogle) },
        { name: 'ikindi', time: timeToMinutes(times.ikindi) },
        { name: 'aksam', time: timeToMinutes(times.aksam) },
        { name: 'yatsi', time: timeToMinutes(times.yatsi) }
    ];
    
    // Önce tüm aktif sınıfları kaldır
    elements.timeCards.forEach(card => card.classList.remove('active'));
    
    // Güncel vakti bul
    let currentPrayer = prayers[prayers.length - 1];
    for (let i = prayers.length - 1; i >= 0; i--) {
        if (currentTime >= prayers[i].time) {
            currentPrayer = prayers[i];
            break;
        }
    }
    
    // Aktif vakti işaretle
    const activeCard = document.querySelector(`[data-prayer="${currentPrayer.name}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === '--:--') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// ============================================
// GERİ SAYIM BAŞLAT
// ============================================
function startCountdown(times) {
    // Önceki interval'ı temizle
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    const prayers = [
        { name: 'İmsak', time: times.imsak },
        { name: 'Sabah', time: times.sabah },
        { name: 'Öğle', time: times.ogle },
        { name: 'İkindi', time: times.ikindi },
        { name: 'Akşam', time: times.aksam },
        { name: 'Yatsı', time: times.yatsi }
    ];
    
    function updateCountdown() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentSeconds = now.getSeconds();
        
        // Sonraki vakti bul
        let nextPrayer = null;
        for (let prayer of prayers) {
            const prayerMinutes = timeToMinutes(prayer.time);
            if (currentTime < prayerMinutes) {
                nextPrayer = prayer;
                break;
            }
        }
        
        // Eğer günün vakitleri bittiyse, yarınki ilk vakit (İmsak)
        if (!nextPrayer) {
            nextPrayer = prayers[0];
        }
        
        // Kalan süreyi hesapla
        const nextPrayerMinutes = timeToMinutes(nextPrayer.time);
        let diffMinutes = nextPrayerMinutes - currentTime;
        
        // Eğer gün sonuysa ve yarınki ilk vakte sayıyorsa
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60; // 24 saat ekle
        }
        
        const diffSeconds = diffMinutes * 60 - currentSeconds;
        
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        
        // Ekrana yaz
        elements.countdownHours.textContent = String(hours).padStart(2, '0');
        elements.countdownMinutes.textContent = String(minutes).padStart(2, '0');
        elements.countdownSeconds.textContent = String(seconds).padStart(2, '0');
        elements.nextPrayerName.textContent = `${nextPrayer.name} Vaktine Kalan Süre`;
        
        // Her dakika aktif vakti güncelle
        if (currentSeconds === 0) {
            highlightCurrentPrayer(times);
        }
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// ============================================
// YÜKLENİYOR GÖSTER/GİZLE
// ============================================
function showLoading() {
    elements.loading.style.display = 'block';
    elements.prayerTimes.style.display = 'none';
    elements.countdownSection.style.display = 'none';
    elements.infoBar.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

// ============================================
// SAYFA KAPATILDIĞINDA
// ============================================
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

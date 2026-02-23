/**
 * All 64 zillas (districts) of Bangladesh.
 * Grouped by division for reference but exported as flat arrays for validation.
 */

const ZILLAS = [
  // Dhaka Division
  "Dhaka", "Gazipur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi",
  "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Rajbari", "Shariatpur",
  "Tangail",
  // Chittagong Division
  "Chittagong", "Cox's Bazar", "Bandarban", "Rangamati", "Khagrachhari",
  "Comilla", "Brahmanbaria", "Chandpur", "Feni", "Lakshmipur", "Noakhali",
  // Rajshahi Division
  "Rajshahi", "Bogra", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj",
  "Pabna", "Sirajganj",
  // Khulna Division
  "Khulna", "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Kushtia",
  "Magura", "Meherpur", "Narail", "Satkhira",
  // Barisal Division
  "Barisal", "Barguna", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
  // Sylhet Division
  "Sylhet", "Habiganj", "Moulvibazar", "Sunamganj",
  // Rangpur Division
  "Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
  "Panchagarh", "Thakurgaon",
  // Mymensingh Division
  "Mymensingh", "Jamalpur", "Netrokona", "Sherpur",
];

/**
 * Complete list of all thanas/upazilas grouped by district.
 * Source: Bangladesh Election Commission / BBS administrative data.
 * Total: ~492 upazilas across all 64 districts.
 */
const THANAS_BY_ZILLA = {

  // ── DHAKA DIVISION ──────────────────────────────────────────────────────────

  "Dhaka": [
    // City thanas (DNCC/DSCC areas)
    "Adabor", "Badda", "Banani", "Bangshal", "Cantonment", "Chawkbazar",
    "Dakshinkhan", "Darus Salam", "Demra", "Dhanmondi", "Gendaria", "Gulshan",
    "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul", "Kalabagan", "Kamrangirchar",
    "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur",
    "Motijheel", "Mugda", "Nawabganj", "New Market", "Pallabi", "Paltan",
    "Ramna", "Rayer Bazar", "Sabujbagh", "Shah Ali", "Shahbagh",
    "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Turag",
    "Uttara", "Uttarkhan", "Vatara", "Wari",
    // Upazila-level (outside city corps)
    "Dhamrai", "Dohar", "Keraniganj", "Nawabganj","Savar"
  ],

  "Gazipur": [
    "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur",
  ],

  "Manikganj": [
    "Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar",
    "Saturia", "Shivalaya", "Singair",
  ],

  "Munshiganj": [
    "Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan",
    "Sreenagar", "Tongibari",
  ],

  "Narayanganj": [
    "Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon",
  ],

  "Narsingdi": [
    "Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur",
  ],

  "Faridpur": [
    "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar",
    "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha",
  ],

  "Gopalganj": [
    "Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara",
  ],

  "Kishoreganj": [
    "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj",
    "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain",
    "Nikli", "Pakundia", "Tarail",
  ],

  "Madaripur": [
    "Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar",
  ],

  "Rajbari": [
    "Baliakandi", "Goalandaghat", "Kalukhali", "Pangsha", "Rajbari Sadar",
  ],

  "Shariatpur": [
    "Bhedarganj", "Damudya", "Gosairhat", "Naria",
    "Shariatpur Sadar", "Zanjira",
  ],

  "Tangail": [
    "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur",
    "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar",
  ],

  // ── CHITTAGONG DIVISION ──────────────────────────────────────────────────────

  "Chittagong": [
    "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari",
    "Hathazari", "Karnaphuli", "Lohagara", "Mirsharai",
    "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda",
    // City thanas
    "Bakalia", "Bayazid", "Chandgaon", "Chittagong Port", "Double Mooring",
    "EPZ", "Khulshi", "Kotwali", "Pahartali", "Panchlaish", "Patenga",
  ],

  "Cox's Bazar": [
    "Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali",
    "Pekua", "Ramu", "Teknaf", "Ukhia",
  ],

  "Bandarban": [
    "Ali Kadam", "Bandarban Sadar", "Lama", "Naikhongchhari",
    "Rowangchhari", "Ruma", "Thanchi",
  ],

  "Rangamati": [
    "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai",
    "Kaukhali", "Langadu", "Naniarchar", "Rajasthali", "Rangamati Sadar",
  ],

  "Khagrachhari": [
    "Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari",
    "Manikchhari", "Matiranga", "Panchhari", "Ramgarh",
  ],

  "Comilla": [
    "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram",
    "Comilla Sadar", "Comilla Sadar South", "Daudkandi", "Debidwar",
    "Homna", "Laksam", "Lalmai", "Meghna", "Monohorgonj",
    "Muradnagar", "Nangalkot", "Titas",
  ],

  "Brahmanbaria": [
    "Akhaura", "Ashuganj", "Bancharampur", "Brahmanbaria Sadar",
    "Kasba", "Nabinagar", "Nasirnagar", "Sarail",
  ],

  "Chandpur": [
    "Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj",
    "Kachua", "Matlab North", "Matlab South", "Shahrasti",
  ],

  "Feni": [
    "Chhagalnaiya", "Daganbhuiyan", "Feni Sadar",
    "Parshuram", "Sonagazi", "Fulgazi",
  ],

  "Lakshmipur": [
    "Kamalnagar", "Lakshmipur Sadar", "Ramganj", "Ramgati", "Raipur",
  ],

  "Noakhali": [
    "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat",
    "Noakhali Sadar", "Senbagh", "Sonaimuri", "Subarnachar",
  ],

  // ── RAJSHAHI DIVISION ────────────────────────────────────────────────────────

  "Rajshahi": [
    "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari",
    "Mohanpur", "Paba", "Puthia", "Tanore",
    // City thanas
    "Boalia", "Matihar", "Rajpara", "Shah Makhdum",
  ],

  "Bogra": [
    "Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali",
    "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur",
    "Sherpur", "Shibganj", "Sonatola",
  ],

  "Joypurhat": [
    "Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi",
  ],

  "Naogaon": [
    "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur",
    "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar",
  ],

  "Natore": [
    "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur",
    "Natore Sadar", "Singra",
  ],

  "Chapainawabganj": [
    "Bholahat", "Chapainawabganj Sadar", "Gomastapur",
    "Nachole", "Shibganj",
  ],

  "Pabna": [
    "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur",
    "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar",
  ],

  "Sirajganj": [
    "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur",
    "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara",
  ],

  // ── KHULNA DIVISION ──────────────────────────────────────────────────────────

  "Khulna": [
    "Batiaghata", "Dacope", "Dumuria", "Dighalia",
    "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada",
    // City thanas
    "Daulatpur", "Khalishpur", "Khan Jahan Ali", "Khulna Sadar",
    "Sonadanga",
  ],

  "Bagerhat": [
    "Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua",
    "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola",
  ],

  "Chuadanga": [
    "Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar",
  ],

  "Jessore": [
    "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha",
    "Jessore Sadar", "Keshabpur", "Manirampur", "Sharsha",
  ],

  "Jhenaidah": [
    "Harinakunda", "Jhenaidah Sadar", "Kaliganj",
    "Kotchandpur", "Maheshpur", "Shailkupa",
  ],

  "Kushtia": [
    "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali",
    "Kushtia Sadar", "Mirpur",
  ],

  "Magura": [
    "Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur",
  ],

  "Meherpur": [
    "Gangni", "Meherpur Sadar", "Mujibnagar",
  ],

  "Narail": [
    "Kalia", "Lohagara", "Narail Sadar",
  ],

  "Satkhira": [
    "Assasuni", "Debhata", "Kalaroa", "Kaliganj",
    "Satkhira Sadar", "Shyamnagar", "Tala",
  ],

  // ── BARISAL DIVISION ─────────────────────────────────────────────────────────

  "Barisal": [
    "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi",
    "Hizla", "Mehendiganj", "Muladi", "Wazirpur",
    // City thanas
    "Barisal Sadar", "Airport", "Banda", "Kawnia",
  ],

  "Barguna": [
    "Amtali", "Bamna", "Barguna Sadar",
    "Betagi", "Patharghata", "Taltali",
  ],

  "Bhola": [
    "Bhola Sadar", "Burhanuddin", "Char Fasson",
    "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin",
  ],

  "Jhalokati": [
    "Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur",
  ],

  "Patuakhali": [
    "Bauphal", "Dashmina", "Dumki", "Galachipa",
    "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali",
  ],

  "Pirojpur": [
    "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur",
    "Pirojpur Sadar", "Nesarabad", "Zianagar",
  ],

  // ── SYLHET DIVISION ──────────────────────────────────────────────────────────

  "Sylhet": [
    "Balaganj", "Beanibazar", "Bishwanath", "Companiganj",
    "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat",
    "Jaintiapur", "Kanaighat", "Osmani Nagar", "Zakiganj",
    // City thanas
    "Sylhet Sadar", "Shahporan", "Moglabazar",
  ],

  "Habiganj": [
    "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat",
    "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj",
  ],

  "Moulvibazar": [
    "Barlekha", "Juri", "Kamalganj", "Kulaura",
    "Moulvibazar Sadar", "Rajnagar", "Sreemangal",
  ],

  "Sunamganj": [
    "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha",
    "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah",
    "Sunamganj Sadar", "South Sunamganj", "Tahirpur",
  ],

  // ── RANGPUR DIVISION ─────────────────────────────────────────────────────────

  "Rangpur": [
    "Badarganj", "Gangachara", "Kaunia", "Mithapukur",
    "Pirgachha", "Pirganj", "Taraganj",
    // City thanas
    "Rangpur Sadar", "Kotwali",
  ],

  "Dinajpur": [
    "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar",
    "Dinajpur Sadar", "Fulbari", "Ghoraghat", "Hakimpur",
    "Kaharole", "Khansama", "Nawabganj", "Parbatipur",
  ],

  "Gaibandha": [
    "Fulchhari", "Gaibandha Sadar", "Gobindaganj",
    "Palashbari", "Sadullapur", "Saghata", "Sundarganj",
  ],

  "Kurigram": [
    "Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar",
    "Nageshwari", "Phulbari", "Rajarhat", "Raumari", "Ulipur",
  ],

  "Lalmonirhat": [
    "Aditmari", "Hatibandha", "Kaliganj",
    "Lalmonirhat Sadar", "Patgram",
  ],

  "Nilphamari": [
    "Dimla", "Domar", "Jaldhaka",
    "Kishoreganj", "Nilphamari Sadar", "Saidpur",
  ],

  "Panchagarh": [
    "Atwari", "Boda", "Debiganj",
    "Panchagarh Sadar", "Tetulia",
  ],

  "Thakurgaon": [
    "Baliadangi", "Haripur", "Pirganj",
    "Ranisankail", "Thakurgaon Sadar",
  ],

  // ── MYMENSINGH DIVISION ──────────────────────────────────────────────────────

  "Mymensingh": [
    "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur",
    "Haluaghat", "Ishwarganj", "Muktagachha", "Mymensingh Sadar",
    "Nandail", "Phulpur", "Trishal",
  ],

  "Jamalpur": [
    "Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar",
    "Madarganj", "Melandaha", "Sarishabari",
  ],

  "Netrokona": [
    "Atpara", "Barhatta", "Durgapur", "Kalmakanda",
    "Kendua", "Khaliajuri", "Madan", "Mohanganj",
    "Netrokona Sadar", "Purbadhala",
  ],

  "Sherpur": [
    "Jhenaigati", "Nakla", "Nalitabari",
    "Sherpur Sadar", "Sreebardi",
  ],
};

/**
 * Flat array of all thanas – deduplicated.
 * Useful for simple validation / autocomplete.
 */
const THANAS = [...new Set(Object.values(THANAS_BY_ZILLA).flat())];

module.exports = { ZILLAS, THANAS, THANAS_BY_ZILLA };
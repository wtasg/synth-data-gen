function titleCase(value: string): string {
    return value
        .split(/([\s'-]+)/)
        .map((part) => /^[\s'-]+$/.test(part)
            ? part
            : /[a-z][A-Z]/.test(part)
                ? part
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("");
}

function unique(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => titleCase(value.trim())).filter(Boolean)));
}

function weightFor(index: number): number {
    return 5 - (index % 4);
}

function buildNames(
    base: string[],
    starts: string[],
    ends: string[],
    target: number,
    excludes: RegExp[] = [],
): string[] {
    const names = new Set(unique(base));
    outer:
    for (const start of starts) {
        for (const end of ends) {
            const candidate = titleCase(`${start}${end}`);
            if (candidate.length < 4 || candidate.length > 12) {
                continue;
            }
            if (excludes.some((expression) => expression.test(candidate))) {
                continue;
            }
            names.add(candidate);
            if (names.size >= target) {
                break outer;
            }
        }
    }
    return Array.from(names).slice(0, target);
}

function nameRecords(names: string[], gender: "male" | "female", country: string[]) {
    return names.map((value, index) => ({
        value,
        gender,
        country,
        weight: weightFor(index),
    }));
}

function buildStreetNames(roots: string[], types: string[], target: number): string[] {
    const streets = new Set<string>();
    outer:
    for (const root of roots) {
        for (const type of types) {
            streets.add(`${root} ${type}`);
            if (streets.size >= target) {
                break outer;
            }
        }
    }
    return Array.from(streets);
}

function areaTriplet(city: string, district: string, state: string): string[] {
    return [
        `${city} Central`,
        `${district.replace(/ County$| Urban$| District$/g, "")} Heights`,
        `${state.split(" ")[0]} Gardens`,
    ];
}

type LocationSeed = {
    city: string;
    district: string;
    state: string;
    postalCode: string;
};

function postalRecords(seeds: LocationSeed[], country: string) {
    return seeds.map((seed, index) => ({
        postalCode: seed.postalCode,
        city: seed.city,
        district: seed.district,
        state: seed.state,
        country,
        areas: areaTriplet(seed.city, seed.district, seed.state),
        weight: weightFor(index),
    }));
}

function generatedUsPostalCode(index: number): string {
    return String(10001 + index * 173).padStart(5, "0");
}

function generatedInPostalCode(index: number): string {
    const prefixes = [110001, 226001, 302001, 380001, 400001, 500001, 560101, 600001, 682001, 700001];
    const prefix = prefixes[index % prefixes.length];
    return String(prefix + Math.floor(index / prefixes.length) * 7).padStart(6, "0");
}

function generatedFrPostalCode(index: number): string {
    return String(75001 + index * 11).padStart(5, "0");
}

const enMaleBase = [
    "Stuart", "Stephen", "Andrew", "Benjamin", "Daniel", "Henry", "Aaron", "Adam", "Adrian", "Aiden",
    "Alan", "Albert", "Alexander", "Alfred", "Anthony", "Arthur", "Asher", "Austin", "Barrett", "Blake",
    "Brandon", "Brian", "Caleb", "Cameron", "Charles", "Christian", "Christopher", "Connor", "Dominic", "Dylan",
    "Edward", "Elias", "Elliot", "Ethan", "Evan", "Felix", "Gabriel", "Gavin", "George", "Graham",
    "Harrison", "Hudson", "Isaac", "Jack", "Jacob", "James", "Jasper", "Jonathan", "Joseph", "Julian",
    "Leo", "Levi", "Liam", "Logan", "Lucas", "Marcus", "Mason", "Matthew", "Michael", "Nathan",
    "Nicholas", "Noah", "Oliver", "Owen", "Patrick", "Peter", "Philip", "Ryan", "Samuel", "Sebastian",
    "Simon", "Theodore", "Thomas", "Victor", "Vincent", "Walter", "William", "Wyatt", "Zachary", "Miles",
];

const enFemaleBase = [
    "Annette", "Anna", "Anne", "Emma", "Grace", "Lucy", "Marie", "Taylor", "Abigail", "Addison",
    "Adeline", "Alicia", "Amelia", "Amy", "Ariana", "Ashley", "Audrey", "Aurora", "Bella", "Brianna",
    "Camila", "Caroline", "Charlotte", "Chloe", "Claire", "Clara", "Daisy", "Delilah", "Ella", "Elena",
    "Eliza", "Elizabeth", "Emily", "Eva", "Evelyn", "Faith", "Fiona", "Gabriella", "Georgia", "Hailey",
    "Hannah", "Harper", "Hazel", "Iris", "Isabelle", "Jade", "Jasmine", "Josephine", "Julia", "Katherine",
    "Layla", "Lila", "Lillian", "Lily", "Madeline", "Madison", "Maya", "Mia", "Naomi", "Natalie",
    "Nora", "Olivia", "Penelope", "Rachel", "Rebecca", "Rose", "Ruby", "Sabrina", "Samantha", "Sarah",
    "Sophia", "Stella", "Summer", "Valerie", "Victoria", "Violet", "Vivian", "Willow", "Zoe", "Elodie",
];

const hiMaleBase = [
    "Aarav", "Arjun", "Karthik", "Rohan", "Aditya", "Akash", "Aniket", "Arnav", "Bhavesh", "Darshan",
    "Dev", "Dhruv", "Gautam", "Harish", "Ishan", "Jatin", "Kabir", "Karan", "Krish", "Laksh",
    "Manav", "Mihir", "Mohan", "Nakul", "Naveen", "Nikhil", "Omkar", "Pranav", "Raghav", "Rahul",
    "Raj", "Rajat", "Rakesh", "Ritvik", "Sahil", "Samar", "Sanjay", "Shivam", "Siddharth", "Tanish",
    "Uday", "Varun", "Vedant", "Vihaan", "Vikram", "Yash", "Yuvraj", "Aneesh", "Bhargav", "Devansh",
    "Ivaan", "Jayesh", "Lakshit", "Mayank", "Neel", "Parth", "Ritesh", "Sharvil", "Tanmay", "Vivaan",
];

const hiFemaleBase = [
    "Ananya", "Ishita", "Meera", "Priya", "Stuti", "Aarohi", "Aditi", "Ahana", "Akshara", "Anika",
    "Anvi", "Bhavya", "Charvi", "Deepika", "Diya", "Esha", "Gauri", "Ira", "Ishani", "Janvi",
    "Kashvi", "Kavya", "Kiara", "Lavanya", "Mahika", "Manya", "Myra", "Navya", "Niharika", "Pari",
    "Prisha", "Rhea", "Riddhi", "Saanvi", "Sakshi", "Samaira", "Sara", "Shanaya", "Shreya", "Siya",
    "Tanvi", "Trisha", "Urvi", "Vaishnavi", "Vanya", "Vidhi", "Yamini", "Aishwarya", "Charita", "Damini",
    "Hansika", "Jhanvi", "Kritika", "Madhuri", "Nandini", "Pallavi", "Ritika", "Sharanya", "Tanya", "Vasudha",
];

const frMaleBase = [
    "Adrien", "Etienne", "Luc", "Alexis", "Antoine", "Arthur", "Bastien", "Benoit", "Charles", "Clement",
    "Corentin", "Damien", "Emile", "Enzo", "Fabien", "Florian", "Gabriel", "Gaspard", "Guillaume", "Hugo",
    "Jules", "Julien", "Laurent", "Leo", "Leon", "Louis", "Lucas", "Mathieu", "Maxence", "Nicolas",
    "Noe", "Olivier", "Paul", "Pierre", "Quentin", "Raphael", "Remi", "Samuel", "Sebastien", "Theo",
    "Thomas", "Valentin", "Victor", "Vincent", "Yanis", "Amaury", "Cedric", "Damien", "Frederic", "Loic",
    "Martin", "Romain", "Timothee", "Tristan", "Baptiste", "Jean", "Pascal", "Philippe", "Sylvain", "Xavier",
];

const frFemaleBase = [
    "Annette", "Amelie", "Claire", "Marie", "Adeline", "Alice", "Anais", "Ariane", "Audrey", "Beatrice",
    "Camille", "Capucine", "Celine", "Charlotte", "Chloe", "Claudine", "Delphine", "Elise", "Elodie", "Emma",
    "Estelle", "Eugenie", "Florence", "Gabrielle", "Helene", "Ines", "Iris", "Jacqueline", "Jeanne", "Josephine",
    "Juliette", "Laetitia", "Lea", "Leonie", "Louise", "Lucie", "Madeleine", "Manon", "Margaux", "Marion",
    "Mathilde", "Meline", "Mireille", "Nadine", "Noemie", "Oceane", "Pauline", "Rosalie", "Sabine", "Solene",
    "Suzanne", "Valentine", "Victoire", "Violette", "Yvette", "Apolline", "Celeste", "Emeline", "Maelle", "Aurore",
];

const enMaleGenerated = buildNames(
    enMaleBase,
    ["Ald", "Arl", "Beck", "Bren", "Call", "Cedr", "Dari", "Edw", "Elli", "Emers", "Fin", "Garr", "Harl", "Hold", "Jami", "Jer", "Lenn", "Merr", "Norr", "Raff", "Rem", "Tobi", "Warr", "Wes", "Zane"],
    ["an", "en", "on", "er", "el", "ett", "ian", "iel", "son", "ton", "us", "well"],
    170,
    [/^Stu/i],
);

const enFemaleGenerated = buildNames(
    enFemaleBase,
    ["Adel", "Ari", "Be", "Bri", "Cami", "Clari", "Dani", "Eli", "Emi", "Eval", "Feli", "Gabi", "Hall", "Isab", "Juli", "Kati", "Lili", "Madi", "Naom", "Oliv", "Rosal", "Sop", "Val", "Viv", "Zari"],
    ["a", "ah", "ana", "ella", "elle", "ia", "ina", "isa", "lyn", "ette", "ine", "ora"],
    170,
    [/^Ann/i],
);

const hiMaleGenerated = buildNames(
    hiMaleBase,
    ["Aar", "Adi", "Ani", "Ar", "Bhav", "Dev", "Har", "Ish", "Jay", "Kar", "Laksh", "Man", "Nav", "Om", "Pran", "Ragh", "Sai", "Tan", "Uday", "Vi", "Yash"],
    ["av", "an", "ant", "deep", "esh", "it", "raj", "veer", "vin", "yansh", "endra", "tej"],
    170,
);

const hiFemaleGenerated = buildNames(
    hiFemaleBase,
    ["Aar", "An", "Ashi", "Bhav", "Char", "Deep", "Divy", "Ish", "Jan", "Kav", "Kr", "Meh", "Nav", "Nih", "Pall", "Pr", "Riddh", "Shar", "Tan", "Vaid", "Yam"],
    ["a", "ika", "ini", "isha", "ita", "na", "preet", "shree", "tika", "ya", "angi", "rita"],
    170,
);

const frMaleGenerated = buildNames(
    frMaleBase,
    ["Adr", "Al", "Amaur", "Bapt", "Beno", "Camil", "Cyr", "Dam", "Em", "Eti", "Flor", "Gabri", "Henr", "Jul", "Laur", "Lion", "Luc", "Math", "Nicol", "Oliv", "Quent", "Rapha", "Rem", "Sebast", "Theo", "Trist", "Vict"],
    ["e", "ien", "in", "is", "oire", "on", "ot", "el", "ard", "ent"],
    170,
);

const frFemaleGenerated = buildNames(
    frFemaleBase,
    ["Adel", "Amand", "Ari", "Beatr", "Camill", "Celest", "Clair", "Delph", "Elod", "Emil", "Estell", "Floren", "Gabriell", "Helen", "Isab", "Jos", "Juliett", "Leont", "Luc", "Madele", "Mar", "Noem", "Oce", "Paul", "Rosal", "Solen", "Valent", "Viv"],
    ["e", "ie", "ine", "elle", "ette", "a", "ise", "otte", "iane", "ine"],
    170,
);

const lastNameBase = [
    "Wilson", "Carter", "McKenzie", "Anderson", "Studentson", "Patel", "Dubois", "Singh", "Johnson", "Brown",
    "Taylor", "Thomas", "Roberts", "Turner", "Walker", "White", "Bennett", "Brooks", "Campbell", "Collins",
    "Cooper", "Edwards", "Evans", "Fisher", "Foster", "Graham", "Griffin", "Harris", "Hayes", "Henderson",
    "Howard", "Jenkins", "Kelly", "King", "Lee", "Long", "Marshall", "Miller", "Mitchell", "Moore",
    "Morgan", "Morris", "Murphy", "Nelson", "Parker", "Perry", "Price", "Reed", "Richardson", "Ross",
    "Russell", "Scott", "Stewart", "Ward", "Watson", "Wright", "Young", "Sharma", "Verma", "Gupta",
    "Mehta", "Kapoor", "Reddy", "Iyer", "Menon", "Bhat", "Kulkarni", "Saxena", "Khanna", "Agarwal",
    "Chopra", "Malhotra", "Bose", "Ghosh", "Nair", "Pillai", "Rana", "Sethi", "Thakur", "Vora",
    "Lefevre", "Laurent", "Moreau", "Garcia", "Martin", "Bernard", "Roux", "Petit", "Fontaine", "Chevalier",
];

const lastNameGenerated = buildNames(
    lastNameBase,
    ["Ash", "Bark", "Beck", "Black", "Bright", "Brook", "Car", "Clair", "Cran", "Daven", "East", "Fair", "Fern", "Glen", "Hart", "Kings", "Lake", "Lang", "North", "Oak", "Park", "Queens", "Raven", "Silver", "Stone", "West", "Whit", "Winter", "Wood"],
    ["berg", "field", "ford", "ham", "ley", "man", "mont", "ridge", "son", "stead", "stone", "ton", "well", "wood"],
    260,
    [/^Mc/i],
);

const usSeeds: LocationSeed[] = [
    { city: "New York", district: "New York County", state: "New York", postalCode: "10001" },
    { city: "Atlanta", district: "Fulton County", state: "Georgia", postalCode: "30301" },
    { city: "Chicago", district: "Cook County", state: "Illinois", postalCode: "60601" },
    { city: "Los Angeles", district: "Los Angeles County", state: "California", postalCode: generatedUsPostalCode(3) },
    { city: "San Francisco", district: "San Francisco County", state: "California", postalCode: generatedUsPostalCode(4) },
    { city: "Seattle", district: "King County", state: "Washington", postalCode: generatedUsPostalCode(5) },
    { city: "Boston", district: "Suffolk County", state: "Massachusetts", postalCode: generatedUsPostalCode(6) },
    { city: "Austin", district: "Travis County", state: "Texas", postalCode: generatedUsPostalCode(7) },
    { city: "Dallas", district: "Dallas County", state: "Texas", postalCode: generatedUsPostalCode(8) },
    { city: "Houston", district: "Harris County", state: "Texas", postalCode: generatedUsPostalCode(9) },
    { city: "Miami", district: "Miami-Dade County", state: "Florida", postalCode: generatedUsPostalCode(10) },
    { city: "Orlando", district: "Orange County", state: "Florida", postalCode: generatedUsPostalCode(11) },
    { city: "Phoenix", district: "Maricopa County", state: "Arizona", postalCode: generatedUsPostalCode(12) },
    { city: "Denver", district: "Denver County", state: "Colorado", postalCode: generatedUsPostalCode(13) },
    { city: "Portland", district: "Multnomah County", state: "Oregon", postalCode: generatedUsPostalCode(14) },
    { city: "Las Vegas", district: "Clark County", state: "Nevada", postalCode: generatedUsPostalCode(15) },
    { city: "Philadelphia", district: "Philadelphia County", state: "Pennsylvania", postalCode: generatedUsPostalCode(16) },
    { city: "Pittsburgh", district: "Allegheny County", state: "Pennsylvania", postalCode: generatedUsPostalCode(17) },
    { city: "Detroit", district: "Wayne County", state: "Michigan", postalCode: generatedUsPostalCode(18) },
    { city: "Minneapolis", district: "Hennepin County", state: "Minnesota", postalCode: generatedUsPostalCode(19) },
    { city: "Nashville", district: "Davidson County", state: "Tennessee", postalCode: generatedUsPostalCode(20) },
    { city: "Charlotte", district: "Mecklenburg County", state: "North Carolina", postalCode: generatedUsPostalCode(21) },
    { city: "Raleigh", district: "Wake County", state: "North Carolina", postalCode: generatedUsPostalCode(22) },
    { city: "Columbus", district: "Franklin County", state: "Ohio", postalCode: generatedUsPostalCode(23) },
    { city: "Cleveland", district: "Cuyahoga County", state: "Ohio", postalCode: generatedUsPostalCode(24) },
    { city: "Cincinnati", district: "Hamilton County", state: "Ohio", postalCode: generatedUsPostalCode(25) },
    { city: "Kansas City", district: "Jackson County", state: "Missouri", postalCode: generatedUsPostalCode(26) },
    { city: "St. Louis", district: "St. Louis County", state: "Missouri", postalCode: generatedUsPostalCode(27) },
    { city: "New Orleans", district: "Orleans Parish", state: "Louisiana", postalCode: generatedUsPostalCode(28) },
    { city: "Salt Lake City", district: "Salt Lake County", state: "Utah", postalCode: generatedUsPostalCode(29) },
    { city: "Boise", district: "Ada County", state: "Idaho", postalCode: generatedUsPostalCode(30) },
    { city: "Milwaukee", district: "Milwaukee County", state: "Wisconsin", postalCode: generatedUsPostalCode(31) },
    { city: "Madison", district: "Dane County", state: "Wisconsin", postalCode: generatedUsPostalCode(32) },
    { city: "Indianapolis", district: "Marion County", state: "Indiana", postalCode: generatedUsPostalCode(33) },
    { city: "Louisville", district: "Jefferson County", state: "Kentucky", postalCode: generatedUsPostalCode(34) },
    { city: "Richmond", district: "Richmond County", state: "Virginia", postalCode: generatedUsPostalCode(35) },
    { city: "Norfolk", district: "Norfolk County", state: "Virginia", postalCode: generatedUsPostalCode(36) },
    { city: "Tampa", district: "Hillsborough County", state: "Florida", postalCode: generatedUsPostalCode(37) },
    { city: "Sacramento", district: "Sacramento County", state: "California", postalCode: generatedUsPostalCode(38) },
    { city: "San Diego", district: "San Diego County", state: "California", postalCode: generatedUsPostalCode(39) },
    { city: "San Jose", district: "Santa Clara County", state: "California", postalCode: generatedUsPostalCode(40) },
    { city: "Albuquerque", district: "Bernalillo County", state: "New Mexico", postalCode: generatedUsPostalCode(41) },
    { city: "Oklahoma City", district: "Oklahoma County", state: "Oklahoma", postalCode: generatedUsPostalCode(42) },
    { city: "Tulsa", district: "Tulsa County", state: "Oklahoma", postalCode: generatedUsPostalCode(43) },
    { city: "Birmingham", district: "Jefferson County", state: "Alabama", postalCode: generatedUsPostalCode(44) },
    { city: "Memphis", district: "Shelby County", state: "Tennessee", postalCode: generatedUsPostalCode(45) },
    { city: "Buffalo", district: "Erie County", state: "New York", postalCode: generatedUsPostalCode(46) },
    { city: "Rochester", district: "Monroe County", state: "New York", postalCode: generatedUsPostalCode(47) },
    { city: "Providence", district: "Providence County", state: "Rhode Island", postalCode: generatedUsPostalCode(48) },
    { city: "Hartford", district: "Hartford County", state: "Connecticut", postalCode: generatedUsPostalCode(49) },
];

const inSeeds: LocationSeed[] = [
    { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", postalCode: "560001" },
    { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", postalCode: "560037" },
    { city: "New Delhi", district: "New Delhi", state: "Delhi", postalCode: "110001" },
    { city: "Mysuru", district: "Mysuru", state: "Karnataka", postalCode: generatedInPostalCode(3) },
    { city: "Hubballi", district: "Dharwad", state: "Karnataka", postalCode: generatedInPostalCode(4) },
    { city: "Mangaluru", district: "Dakshina Kannada", state: "Karnataka", postalCode: generatedInPostalCode(5) },
    { city: "Mumbai", district: "Mumbai", state: "Maharashtra", postalCode: generatedInPostalCode(6) },
    { city: "Pune", district: "Pune", state: "Maharashtra", postalCode: generatedInPostalCode(7) },
    { city: "Nagpur", district: "Nagpur", state: "Maharashtra", postalCode: generatedInPostalCode(8) },
    { city: "Nashik", district: "Nashik", state: "Maharashtra", postalCode: generatedInPostalCode(9) },
    { city: "Chennai", district: "Chennai", state: "Tamil Nadu", postalCode: generatedInPostalCode(10) },
    { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", postalCode: generatedInPostalCode(11) },
    { city: "Madurai", district: "Madurai", state: "Tamil Nadu", postalCode: generatedInPostalCode(12) },
    { city: "Hyderabad", district: "Hyderabad", state: "Telangana", postalCode: generatedInPostalCode(13) },
    { city: "Warangal", district: "Hanamkonda", state: "Telangana", postalCode: generatedInPostalCode(14) },
    { city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", postalCode: generatedInPostalCode(15) },
    { city: "Surat", district: "Surat", state: "Gujarat", postalCode: generatedInPostalCode(16) },
    { city: "Vadodara", district: "Vadodara", state: "Gujarat", postalCode: generatedInPostalCode(17) },
    { city: "Jaipur", district: "Jaipur", state: "Rajasthan", postalCode: generatedInPostalCode(18) },
    { city: "Jodhpur", district: "Jodhpur", state: "Rajasthan", postalCode: generatedInPostalCode(19) },
    { city: "Udaipur", district: "Udaipur", state: "Rajasthan", postalCode: generatedInPostalCode(20) },
    { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", postalCode: generatedInPostalCode(21) },
    { city: "Kanpur", district: "Kanpur Nagar", state: "Uttar Pradesh", postalCode: generatedInPostalCode(22) },
    { city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", postalCode: generatedInPostalCode(23) },
    { city: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", postalCode: generatedInPostalCode(24) },
    { city: "Kolkata", district: "Kolkata", state: "West Bengal", postalCode: generatedInPostalCode(25) },
    { city: "Howrah", district: "Howrah", state: "West Bengal", postalCode: generatedInPostalCode(26) },
    { city: "Siliguri", district: "Darjeeling", state: "West Bengal", postalCode: generatedInPostalCode(27) },
    { city: "Bhopal", district: "Bhopal", state: "Madhya Pradesh", postalCode: generatedInPostalCode(28) },
    { city: "Indore", district: "Indore", state: "Madhya Pradesh", postalCode: generatedInPostalCode(29) },
    { city: "Gwalior", district: "Gwalior", state: "Madhya Pradesh", postalCode: generatedInPostalCode(30) },
    { city: "Kochi", district: "Ernakulam", state: "Kerala", postalCode: generatedInPostalCode(31) },
    { city: "Thiruvananthapuram", district: "Thiruvananthapuram", state: "Kerala", postalCode: generatedInPostalCode(32) },
    { city: "Kozhikode", district: "Kozhikode", state: "Kerala", postalCode: generatedInPostalCode(33) },
    { city: "Bhubaneswar", district: "Khordha", state: "Odisha", postalCode: generatedInPostalCode(34) },
    { city: "Cuttack", district: "Cuttack", state: "Odisha", postalCode: generatedInPostalCode(35) },
    { city: "Patna", district: "Patna", state: "Bihar", postalCode: generatedInPostalCode(36) },
    { city: "Gaya", district: "Gaya", state: "Bihar", postalCode: generatedInPostalCode(37) },
    { city: "Ranchi", district: "Ranchi", state: "Jharkhand", postalCode: generatedInPostalCode(38) },
    { city: "Jamshedpur", district: "East Singhbhum", state: "Jharkhand", postalCode: generatedInPostalCode(39) },
    { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh", postalCode: generatedInPostalCode(40) },
    { city: "Amritsar", district: "Amritsar", state: "Punjab", postalCode: generatedInPostalCode(41) },
    { city: "Ludhiana", district: "Ludhiana", state: "Punjab", postalCode: generatedInPostalCode(42) },
    { city: "Dehradun", district: "Dehradun", state: "Uttarakhand", postalCode: generatedInPostalCode(43) },
    { city: "Shimla", district: "Shimla", state: "Himachal Pradesh", postalCode: generatedInPostalCode(44) },
    { city: "Panaji", district: "North Goa", state: "Goa", postalCode: generatedInPostalCode(45) },
    { city: "Raipur", district: "Raipur", state: "Chhattisgarh", postalCode: generatedInPostalCode(46) },
    { city: "Vijayawada", district: "NTR", state: "Andhra Pradesh", postalCode: generatedInPostalCode(47) },
    { city: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh", postalCode: generatedInPostalCode(48) },
    { city: "Guwahati", district: "Kamrup Metropolitan", state: "Assam", postalCode: generatedInPostalCode(49) },
];

const frSeeds: LocationSeed[] = [
    { city: "Paris", district: "Paris", state: "Ile-de-France", postalCode: "75001" },
    { city: "Lyon", district: "Rhone", state: "Auvergne-Rhone-Alpes", postalCode: generatedFrPostalCode(1) },
    { city: "Marseille", district: "Bouches-du-Rhone", state: "Provence-Alpes-Cote d'Azur", postalCode: generatedFrPostalCode(2) },
    { city: "Toulouse", district: "Haute-Garonne", state: "Occitanie", postalCode: generatedFrPostalCode(3) },
    { city: "Nice", district: "Alpes-Maritimes", state: "Provence-Alpes-Cote d'Azur", postalCode: generatedFrPostalCode(4) },
    { city: "Nantes", district: "Loire-Atlantique", state: "Pays de la Loire", postalCode: generatedFrPostalCode(5) },
    { city: "Strasbourg", district: "Bas-Rhin", state: "Grand Est", postalCode: generatedFrPostalCode(6) },
    { city: "Montpellier", district: "Herault", state: "Occitanie", postalCode: generatedFrPostalCode(7) },
    { city: "Bordeaux", district: "Gironde", state: "Nouvelle-Aquitaine", postalCode: generatedFrPostalCode(8) },
    { city: "Lille", district: "Nord", state: "Hauts-de-France", postalCode: generatedFrPostalCode(9) },
    { city: "Rennes", district: "Ille-et-Vilaine", state: "Brittany", postalCode: generatedFrPostalCode(10) },
    { city: "Reims", district: "Marne", state: "Grand Est", postalCode: generatedFrPostalCode(11) },
    { city: "Le Havre", district: "Seine-Maritime", state: "Normandy", postalCode: generatedFrPostalCode(12) },
    { city: "Saint-Etienne", district: "Loire", state: "Auvergne-Rhone-Alpes", postalCode: generatedFrPostalCode(13) },
    { city: "Toulon", district: "Var", state: "Provence-Alpes-Cote d'Azur", postalCode: generatedFrPostalCode(14) },
    { city: "Grenoble", district: "Isere", state: "Auvergne-Rhone-Alpes", postalCode: generatedFrPostalCode(15) },
    { city: "Dijon", district: "Cote-d'Or", state: "Bourgogne-Franche-Comte", postalCode: generatedFrPostalCode(16) },
    { city: "Angers", district: "Maine-et-Loire", state: "Pays de la Loire", postalCode: generatedFrPostalCode(17) },
    { city: "Nimes", district: "Gard", state: "Occitanie", postalCode: generatedFrPostalCode(18) },
    { city: "Clermont-Ferrand", district: "Puy-de-Dome", state: "Auvergne-Rhone-Alpes", postalCode: generatedFrPostalCode(19) },
];

const usStreets = buildStreetNames(
    ["Maple", "Cedar", "Lakeview", "Oak Ridge", "Elm", "Willow", "Pine", "River", "Sunset", "Highland", "Park", "Meadow", "Stone", "Cherry", "Walnut", "Liberty", "Summit", "Forest", "Hillcrest", "Brookside", "North", "South", "East", "West", "Grand", "Mill", "College", "Madison", "Franklin", "Jefferson"],
    ["Avenue", "Street", "Drive", "Road", "Lane", "Boulevard", "Court", "Circle", "Way", "Place"],
    120,
);

const inStreets = buildStreetNames(
    ["MG", "Brigade", "Church", "Outer Ring", "Residency", "Nehru", "Gandhi", "Temple", "Lake", "Station", "Market", "Palace", "Cantonment", "Park", "Ring", "College", "Airport", "Garden", "Hill", "River", "Sector", "Link", "Canal", "Ashoka", "Lotus", "Sunrise", "Harmony", "Silver", "Green", "Royal"],
    ["Road", "Street", "Layout", "Nagar", "Marg", "Lane", "Cross", "Main", "Extension", "Circle"],
    120,
);

const frStreets = buildStreetNames(
    ["Rue de la Paix", "Avenue Victor", "Boulevard Saint", "Rue du Port", "Avenue des", "Rue des", "Place de", "Quai du", "Chemin des", "Allee des", "Rue Mont", "Avenue Jean", "Boulevard du", "Rue de l'", "Cours de", "Promenade des", "Rue Saint", "Avenue de la", "Rue Belle", "Boulevard de la"],
    ["Roses", "Lilas", "Ecoles", "Tilleuls", "Moulins", "Jardins", "Artisans", "Acacias", "Vignes", "Cedres"],
    120,
);

const phonePlans = [
    {
        country: "US",
        countryCode: "+1",
        nationalLength: 10,
        prefixes: ["201", "202", "212", "213", "214", "215", "303", "312", "347", "404", "408", "415", "425", "469", "510", "512", "617", "646", "702", "718", "786", "818", "917"],
    },
    {
        country: "IN",
        countryCode: "+91",
        nationalLength: 10,
        prefixes: ["98", "99", "97", "96", "95", "94", "93", "92", "91", "90", "89", "88"],
    },
    {
        country: "FR",
        countryCode: "+33",
        nationalLength: 9,
        prefixes: ["6", "7"],
    },
    {
        country: "GB",
        countryCode: "+44",
        nationalLength: 10,
        prefixes: ["71", "72", "73", "74", "75", "76", "77", "78", "79"],
    },
];

const datasets = {
    "firstname/en.json": [
        ...nameRecords(enMaleGenerated, "male", ["US", "GB", "CA"]),
        ...nameRecords(enFemaleGenerated, "female", ["US", "GB", "CA"]),
    ],
    "firstname/hi.json": [
        ...nameRecords(hiMaleGenerated, "male", ["IN"]),
        ...nameRecords(hiFemaleGenerated, "female", ["IN"]),
    ],
    "firstname/fr.json": [
        ...nameRecords(frMaleGenerated, "male", ["FR", "BE"]),
        ...nameRecords(frFemaleGenerated, "female", ["FR", "BE"]),
    ],
    "lastname/en.json": nameRecords(lastNameGenerated, "male", ["US", "GB", "IN", "FR"]).map(({ value, weight }) => ({ value, weight })),
    "postal/us.json": postalRecords(usSeeds, "US"),
    "postal/in.json": postalRecords(inSeeds, "IN"),
    "postal/fr.json": postalRecords(frSeeds, "FR"),
    "streets/us.json": usStreets,
    "streets/in.json": inStreets,
    "streets/fr.json": frStreets,
    "phone/plans.json": phonePlans,
};

for (const [relativePath, data] of Object.entries(datasets)) {
    const url = new URL(`../data/${relativePath}`, import.meta.url);
    await Deno.mkdir(new URL(".", url), { recursive: true });
    await Deno.writeTextFile(url, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(JSON.stringify({
    firstnameEn: datasets["firstname/en.json"].length,
    firstnameHi: datasets["firstname/hi.json"].length,
    firstnameFr: datasets["firstname/fr.json"].length,
    lastnameEn: datasets["lastname/en.json"].length,
    postalUs: datasets["postal/us.json"].length,
    postalIn: datasets["postal/in.json"].length,
    postalFr: datasets["postal/fr.json"].length,
    streetsUs: datasets["streets/us.json"].length,
    streetsIn: datasets["streets/in.json"].length,
    streetsFr: datasets["streets/fr.json"].length,
    phonePlans: datasets["phone/plans.json"].length,
}, null, 2));
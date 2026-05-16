/**
 * One-off generator for static city TS modules. Run: pnpm tsx scripts/generate-static-cities.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const HEADER =
  '// Static data file; 200-line ceiling rule does not apply to data files.\n\n';

function writeTs(
  file: string,
  exportName: string,
  data: Record<string, string[]>,
) {
  const lines = Object.entries(data).map(([code, cities]) => {
    const items = cities.map((c) => `    '${c.replace(/'/g, "\\'")}',`).join('\n');
    return `  '${code}': [\n${items}\n  ],`;
  });
  const body = `export const ${exportName}: Record<string, string[]> = {\n${lines.join('\n')}\n};\n`;
  fs.writeFileSync(file, HEADER + body, 'utf8');
}

const US_CITIES: Record<string, string[]> = {
  TX: [
    'Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington',
    'Corpus Christi', 'Plano', 'Lubbock', 'Laredo', 'Garland', 'Irving', 'Frisco', 'Amarillo',
    'McKinney', 'Grand Prairie', 'Brownsville', 'Pasadena', 'Mesquite', 'Killeen', 'McAllen',
    'Carrollton', 'Midland', 'Waco', 'Denton', 'Round Rock', 'Abilene', 'Pearland', 'Richardson',
    'Tyler', 'College Station', 'Beaumont', 'Sugar Land', 'The Woodlands', 'Lewisville',
    'League City', 'Allen', 'Conroe', 'Odessa', 'San Angelo', 'Wichita Falls', 'Temple',
    'New Braunfels', 'Longview', 'Bryan', 'Edinburg', 'Baytown', 'Pharr', 'Missouri City',
  ],
  CA: [
    'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento',
    'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton',
    'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard',
    'Moreno Valley', 'Glendale', 'Huntington Beach', 'Santa Clarita', 'Garden Grove', 'Oceanside',
    'Rancho Cucamonga', 'Santa Rosa', 'Ontario', 'Elk Grove', 'Corona', 'Lancaster', 'Palmdale',
    'Salinas', 'Hayward', 'Pomona', 'Escondido', 'Sunnyvale', 'Torrance', 'Pasadena', 'Orange',
    'Fullerton', 'Thousand Oaks', 'Visalia', 'Roseville', 'Concord', 'Simi Valley', 'Berkeley',
    'Vallejo', 'Victorville', 'Fairfield', 'Inglewood', 'Santa Clara', 'El Monte', 'Ventura',
    'Antioch', 'Richmond', 'Daly City', 'Carlsbad', 'Murrieta', 'Temecula', 'Clovis', 'Compton',
    'Jurupa Valley', 'Vista', 'South Gate', 'Mission Viejo', 'Redding', 'Santa Maria', 'West Covina',
  ],
  FL: [
    'Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee',
    'Port St. Lucie', 'Cape Coral', 'Fort Lauderdale', 'Pembroke Pines', 'Hollywood', 'Gainesville',
    'Miramar', 'Coral Springs', 'Lehigh Acres', 'Palm Bay', 'West Palm Beach', 'Clearwater',
    'Brandon', 'Spring Hill', 'Lakeland', 'Pompano Beach', 'Davie', 'Miami Gardens', 'Sunrise',
    'Boca Raton', 'Deltona', 'Plantation', 'Palm Coast', 'Largo', 'Deerfield Beach', 'Melbourne',
    'Boynton Beach', 'Lauderhill', 'Kissimmee', 'Homestead', 'Naples', 'Pensacola', 'Sarasota',
    'Bradenton', 'Daytona Beach', 'Ocala', 'Port Orange', 'Sanford', 'Wellington', 'Jupiter',
  ],
  NY: [
    'New York City', 'Buffalo', 'Yonkers', 'Rochester', 'Syracuse', 'Albany', 'New Rochelle',
    'Mount Vernon', 'Schenectady', 'Utica', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls',
    'Binghamton', 'Freeport', 'Valley Stream', 'Ithaca', 'Poughkeepsie', 'Levittown', 'Irondequoit',
    'Saratoga Springs', 'Kingston', 'Rome', 'Elmira', 'Watertown', 'Jamestown', 'Middletown',
    'Auburn', 'Glens Falls', 'Plattsburgh',
  ],
  PA: [
    'Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem',
    'Lancaster', 'Harrisburg', 'Altoona', 'York', 'Wilkes-Barre', 'State College', 'Lebanon',
    'Chester', 'Easton', 'Williamsport', 'Johnstown', 'McKeesport', 'New Castle', 'Butler',
    'Pottstown', 'Chambersburg', 'Greensburg', 'Washington', 'Monroeville', 'Norristown',
  ],
  IL: [
    'Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford', 'Springfield', 'Elgin', 'Peoria',
    'Champaign', 'Waukegan', 'Cicero', 'Bloomington', 'Arlington Heights', 'Schaumburg', 'Decatur',
    'Evanston', 'Des Plaines', 'Oak Lawn', 'Berwyn', 'Mount Prospect', 'Normal', 'Skokie',
    'Orland Park', 'Tinley Park', 'Palatine', 'Wheaton', 'Hoffman Estates', 'Downers Grove',
  ],
  OH: [
    'Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton',
    'Youngstown', 'Lorain', 'Hamilton', 'Springfield', 'Kettering', 'Elyria', 'Lakewood',
    'Cuyahoga Falls', 'Middletown', 'Newark', 'Mansfield', 'Mentor', 'Beavercreek', 'Cleveland Heights',
    'Strongsville', 'Dublin', 'Fairfield', 'Findlay', 'Warren', 'Lancaster', 'Lima', 'Huber Heights',
  ],
  GA: [
    'Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell',
    'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta', 'Valdosta', 'Smyrna',
    'Dunwoody', 'Brookhaven', 'Peachtree Corners', 'Gainesville', 'Newnan', 'Rome', 'Dalton',
    'Hinesville', 'LaGrange', 'Statesboro', 'Carrollton', 'Griffin', 'Pooler', 'Douglasville',
  ],
  NC: [
    'Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary',
    'Wilmington', 'High Point', 'Concord', 'Greenville', 'Asheville', 'Gastonia', 'Jacksonville',
    'Chapel Hill', 'Huntersville', 'Apex', 'Burlington', 'Rocky Mount', 'Wilson', 'Kannapolis',
    'Hickory', 'Goldsboro', 'Mooresville', 'Salisbury', 'Monroe', 'New Bern', 'Sanford',
  ],
  MI: [
    'Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint',
    'Dearborn', 'Livonia', 'Westland', 'Troy', 'Farmington Hills', 'Kalamazoo', 'Wyoming',
    'Southfield', 'Rochester Hills', 'Taylor', 'Pontiac', 'St. Clair Shores', 'Royal Oak',
    'Novi', 'Dearborn Heights', 'Battle Creek', 'Saginaw', 'Kentwood', 'East Lansing', 'Roseville',
    'Portage', 'Midland', 'Lincoln Park', 'Bay City',
  ],
  AZ: [
    'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe',
    'Peoria', 'Surprise', 'Yuma', 'Avondale', 'Goodyear', 'Flagstaff', 'Lake Havasu City',
    'Buckeye', 'Casa Grande', 'Prescott', 'Maricopa', 'Sierra Vista', 'Oro Valley', 'Prescott Valley',
    'Apache Junction', 'Bullhead City', 'Queen Creek', 'San Tan Valley', 'Marana', 'El Mirage',
  ],
  WA: [
    'Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton',
    'Federal Way', 'Yakima', 'Spokane Valley', 'Kirkland', 'Bellingham', 'Auburn', 'Olympia',
    'Redmond', 'Kennewick', 'Pasco', 'Marysville', 'Lakewood', 'Richland', 'Shoreline', 'Sammamish',
    'Burien', 'Lacey', 'Bothell', 'Edmonds', 'Puyallup', 'Wenatchee', 'Issaquah',
  ],
  MA: [
    'Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'Quincy', 'Lynn',
    'New Bedford', 'Newton', 'Somerville', 'Lawrence', 'Framingham', 'Waltham', 'Haverhill',
    'Malden', 'Brookline', 'Plymouth', 'Medford', 'Taunton', 'Chicopee', 'Weymouth', 'Revere',
    'Peabody', 'Methuen', 'Barnstable', 'Pittsfield', 'Attleboro', 'Everett', 'Salem',
  ],
  VA: [
    'Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton',
    'Roanoke', 'Portsmouth', 'Suffolk', 'Lynchburg', 'Harrisonburg', 'Charlottesville', 'Danville',
    'Blacksburg', 'Manassas', 'Petersburg', 'Fredericksburg', 'Winchester', 'Salem', 'Staunton',
    'Fairfax', 'Hopewell', 'Waynesboro', 'Colonial Heights', 'Radford', 'Bristol',
  ],
  TN: [
    'Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin',
    'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville', 'Kingsport', 'Collierville', 'Smyrna',
    'Cleveland', 'Germantown', 'Brentwood', 'Columbia', 'La Vergne', 'Gallatin', 'Cookeville',
    'Mount Juliet', 'Lebanon', 'Morristown', 'Oak Ridge', 'Maryville', 'Bristol', 'Tullahoma',
  ],
  MO: [
    'Kansas City', 'Saint Louis', 'Springfield', 'Columbia', 'Independence', "Lee's Summit",
    "O'Fallon", 'Saint Joseph', 'Saint Charles', 'Saint Peters', 'Blue Springs', 'Florissant',
    'Joplin', 'Jefferson City', 'Cape Girardeau', 'Chesterfield', 'Wildwood', 'University City',
    'Ballwin', 'Raytown', 'Liberty', 'Wentzville', 'Nixa', 'Hannibal', 'Sedalia', 'Rolla',
  ],
  IN: [
    'Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Bloomington', 'Fishers',
    'Hammond', 'Gary', 'Lafayette', 'Muncie', 'Noblesville', 'Terre Haute', 'Kokomo', 'Anderson',
    'Elkhart', 'Mishawaka', 'Lawrence', 'Jeffersonville', 'Columbus', 'Portage', 'New Albany',
    'Richmond', 'Westfield', 'Goshen', 'Merrillville', 'Greenwood', 'Valparaiso',
  ],
  MD: [
    'Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Glen Burnie', 'Ellicott City',
    'Frederick', 'Dundalk', 'Rockville', 'Bethesda', 'Gaithersburg', 'Towson', 'Bowie', 'Aspen Hill',
    'Wheaton', 'Bel Air', 'Salisbury', 'Annapolis', 'College Park', 'Laurel', 'Hagerstown',
    'Severn', 'Odenton', 'Catonsville', 'Essex', 'Chillum', 'Woodlawn', 'Potomac',
  ],
  WI: [
    'Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire',
    'Oshkosh', 'Janesville', 'West Allis', 'La Crosse', 'Sheboygan', 'Wauwatosa', 'Fond du Lac',
    'New Berlin', 'Brookfield', 'Greenfield', 'Beloit', 'Manitowoc', 'Wausau', 'Sun Prairie',
    'Superior', 'Stevens Point', 'Neenah', 'Fitchburg', 'Muskego', 'Mequon',
  ],
  MN: [
    'Minneapolis', 'Saint Paul', 'Rochester', 'Bloomington', 'Duluth', 'Brooklyn Park', 'Plymouth',
    'Maple Grove', 'Saint Cloud', 'Eagan', 'Woodbury', 'Eden Prairie', 'Coon Rapids', 'Burnsville',
    'Blaine', 'Lakeville', 'Minnetonka', 'Apple Valley', 'Edina', 'St. Cloud', 'Mankato',
    'Moorhead', 'Winona', 'Bemidji', 'Hibbing', 'Willmar', 'Faribault', 'Owatonna',
  ],
  CO: [
    'Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada',
    'Westminster', 'Pueblo', 'Centennial', 'Boulder', 'Greeley', 'Longmont', 'Loveland', 'Grand Junction',
    'Broomfield', 'Castle Rock', 'Commerce City', 'Parker', 'Littleton', 'Northglenn', 'Brighton',
    'Englewood', 'Wheat Ridge', 'Lafayette', 'Louisville', 'Durango', 'Montrose',
  ],
  AL: [
    'Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn',
    'Decatur', 'Madison', 'Florence', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City',
    'Opelika', 'Homewood', 'Northport', 'Anniston', 'Prichard', 'Bessemer', 'Enterprise',
  ],
  SC: [
    'Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville',
    'Summerville', 'Sumter', 'Goose Creek', 'Hilton Head Island', 'Florence', 'Spartanburg',
    'Myrtle Beach', 'Anderson', 'Greer', 'Aiken', 'Mauldin', 'Greenwood', 'North Augusta',
    'Easley', 'Simpsonville', 'Hanahan', 'Lexington', 'Conway', 'Orangeburg',
  ],
  LA: [
    'New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City',
    'Monroe', 'Alexandria', 'Houma', 'Marrero', 'Metairie', 'Central', 'Slidell', 'Ruston',
    'Sulphur', 'Hammond', 'Natchitoches', 'Zachary', 'Thibodaux', 'Pineville', 'Crowley',
  ],
  KY: [
    'Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Hopkinsville', 'Richmond',
    'Florence', 'Henderson', 'Jeffersontown', 'Frankfort', 'Georgetown', 'Elizabethtown', 'Nicholasville',
    'Paducah', 'Radcliff', 'Ashland', 'Madisonville', 'Murray', 'Winchester', 'Danville',
  ],
  OR: [
    'Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend', 'Medford',
    'Springfield', 'Corvallis', 'Albany', 'Tigard', 'Lake Oswego', 'Keizer', 'Grants Pass',
    'Oregon City', 'McMinnville', 'Redmond', 'Tualatin', 'West Linn', 'Woodburn', 'Klamath Falls',
    'Roseburg', 'Ashland', 'Newberg', 'Forest Grove',
  ],
  OK: [
    'Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton', 'Edmond', 'Moore', 'Midwest City',
    'Enid', 'Stillwater', 'Muskogee', 'Bartlesville', 'Owasso', 'Shawnee', 'Ponca City', 'Ardmore',
    'Duncan', 'Yukon', 'Del City', 'Bixby', 'Sapulpa', 'Altus', 'Bethany', 'Sand Springs',
  ],
  CT: [
    'Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain',
    'West Hartford', 'Greenwich', 'Fairfield', 'Bristol', 'Meriden', 'Manchester', 'West Haven',
    'Milford', 'Stratford', 'Hamden', 'East Hartford', 'Middletown', 'Norwich', 'Shelton',
  ],
  UT: [
    'Salt Lake City', 'West Valley City', 'West Jordan', 'Provo', 'Orem', 'Sandy', 'Ogden',
    'Saint George', 'Layton', 'South Jordan', 'Lehi', 'Millcreek', 'Taylorsville', 'Logan',
    'Murray', 'Draper', 'Bountiful', 'Riverton', 'Roy', 'Spanish Fork', 'Pleasant Grove',
    'Cedar City', 'Tooele', 'St. George', 'Kearns', 'Midvale',
  ],
  IA: [
    'Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs',
    'Ames', 'West Des Moines', 'Dubuque', 'Ankeny', 'Urbandale', 'Cedar Falls', 'Marion', 'Bettendorf',
    'Mason City', 'Marshalltown', 'Clinton', 'Burlington', 'Ottumwa', 'Fort Dodge', 'Muscatine',
  ],
  NV: [
    'Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko',
    'Mesquite', 'Boulder City', 'Paradise', 'Sunrise Manor', 'Spring Valley', 'Enterprise', 'Summerlin',
    'Pahrump', 'Winnemucca', 'Fallon', 'Laughlin',
  ],
  AR: [
    'Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'North Little Rock',
    'Conway', 'Rogers', 'Bentonville', 'Pine Bluff', 'Hot Springs', 'Benton', 'Texarkana', 'Sherwood',
    'Jacksonville', 'Russellville', 'Bella Vista', 'Paragould', 'Cabot', 'Searcy', 'Van Buren',
  ],
  MS: [
    'Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Olive Branch',
    'Greenville', 'Horn Lake', 'Madison', 'Pearl', 'Clinton', 'Starkville', 'Columbus', 'Vicksburg',
    'Gautier', 'Ocean Springs', 'Ridgeland', 'Brandon', 'Pascagoula', 'Laurel',
  ],
  KS: [
    'Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan',
    'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth', 'Leawood', 'Dodge City', 'Garden City',
    'Emporia', 'Derby', 'Prairie Village', 'Junction City', 'Hays', 'Pittsburg', 'Newton',
  ],
  NM: [
    'Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs',
    'Alamogordo', 'Carlsbad', 'Gallup', 'Deming', 'Los Lunas', 'Chaparral', 'Sunland Park',
    'Las Vegas', 'Portales', 'Artesia', 'Silver City', 'Bloomfield', 'Anthony',
  ],
  NE: [
    'Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'Norfolk',
    'North Platte', 'Columbus', 'Papillion', 'La Vista', 'Scottsbluff', 'South Sioux City',
    'Beatrice', 'Lexington', 'Alliance', 'Gering', 'York', 'McCook', 'Blair',
  ],
  WV: [
    'Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton', 'Fairmont',
    'Martinsburg', 'Beckley', 'Clarksburg', 'South Charleston', 'Vienna', 'Teays Valley', 'Bridgeport',
    'Hurricane', 'Lewisburg', 'Keyser', 'Buckhannon', 'Elkins', 'Oak Hill',
  ],
  ID: [
    "Boise", 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell', "Coeur d'Alene", 'Twin Falls',
    'Lewiston', 'Post Falls', 'Rexburg', 'Moscow', 'Eagle', 'Kuna', 'Ammon', 'Chubbuck', 'Hayden',
    'Mountain Home', 'Blackfoot', 'Garden City',
  ],
  HI: [
    'Honolulu', 'East Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe', 'Mililani Town',
    'Kahului', 'Ewa Gentry', 'Kihei', 'Makakilo', 'Wahiawa', 'Kapolei', 'Wailuku', 'Ewa Beach',
  ],
  NJ: [
    'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River',
    'Hamilton', 'Trenton', 'Clifton', 'Camden', 'Brick', 'Cherry Hill', 'Passaic', 'Union City',
    'Bayonne', 'East Orange', 'Vineland', 'Hoboken', 'New Brunswick', 'Perth Amboy', 'Plainfield',
    'Atlantic City', 'Morristown', 'Hackensack', 'Sayreville', 'Mount Laurel', 'Parsippany',
  ],
  AK: [
    'Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak',
    'Bethel', 'Palmer', 'Homer', 'Soldotna', 'Valdez', 'Nome',
  ],
  NH: [
    'Manchester', 'Nashua', 'Concord', 'Derry', 'Dover', 'Rochester', 'Salem', 'Merrimack',
    'Hudson', 'Londonderry', 'Keene', 'Portsmouth', 'Goffstown', 'Laconia', 'Lebanon',
  ],
  ME: [
    'Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Saco',
    'Westbrook', 'Augusta', 'Waterville', 'Presque Isle', 'Brewer', 'Bath', 'Ellsworth',
  ],
  RI: [
    'Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport',
    'Central Falls', 'Westerly', 'North Providence', 'Cumberland', 'Coventry', 'Middletown',
  ],
  MT: [
    'Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre',
    'Anaconda', 'Miles City', 'Belgrade', 'Livingston', 'Whitefish', 'Laurel', 'Sidney',
  ],
  DE: [
    'Wilmington', 'Dover', 'Newark', 'Middletown', 'Bear', 'Glasgow', 'Brookside', 'Hockessin',
    'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'New Castle',
  ],
  SD: [
    'Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton',
    'Pierre', 'Huron', 'Spearfish', 'Vermillion', 'Brandon', 'Box Elder', 'Sturgis',
  ],
  ND: [
    'Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan',
    'Jamestown', 'Wahpeton', 'Devils Lake', 'Valley City', 'Grafton', 'Beulah',
  ],
  VT: [
    'Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski', 'St. Albans',
    'Newport', 'Vergennes', 'Brattleboro', 'Bennington', 'Middlebury', 'Essex Junction', 'Williston',
  ],
  WY: [
    'Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston',
    'Riverton', 'Jackson', 'Cody', 'Rawlins', 'Lander', 'Powell', 'Douglas',
  ],
  DC: ['Washington'],
};

// Check missing state codes from US_STATES list:
const ALL_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR',
  'PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

for (const code of ALL_CODES) {
  if (!US_CITIES[code]) {
    console.error('Missing US state:', code);
  }
}

const CA_CITIES: Record<string, string[]> = {
  ON: [
    'Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan',
    'Kitchener', 'Windsor', 'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury', 'Oshawa',
    'Barrie', 'St. Catharines', 'Cambridge', 'Kingston', 'Whitby', 'Guelph', 'Ajax', 'Thunder Bay',
    'Waterloo', 'Brantford', 'Pickering', 'Niagara Falls', 'Newmarket', 'Peterborough', 'Sarnia',
    'Sault Ste. Marie', 'North Bay', 'Belleville', 'Cornwall', 'Chatham', 'Orillia',
  ],
  QC: [
    'Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis',
    'Trois-Rivieres', 'Terrebonne', 'Saint-Jean-sur-Richelieu', 'Repentigny', 'Brossard',
    'Drummondville', 'Saint-Jerome', 'Granby', 'Blainville', 'Saint-Hyacinthe', 'Shawinigan',
    'Dollard-des-Ormeaux', 'Rimouski', 'Victoriaville',
  ],
  BC: [
    'Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Victoria',
    'Saanich', 'Langley', 'Delta', 'Kamloops', 'Nanaimo', 'Chilliwack', 'Maple Ridge', 'Prince George',
    'New Westminster', 'North Vancouver', 'Port Coquitlam', 'Chilliwack', 'Vernon', 'Courtenay',
    'Penticton', 'Campbell River',
  ],
  AB: [
    'Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie',
    'Airdrie', 'Spruce Grove', 'Fort McMurray', 'Okotoks', 'Lloydminster', 'Camrose', 'Brooks',
    'Cold Lake', 'Lacombe', 'Wetaskiwin', 'Canmore',
  ],
  MB: [
    'Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk',
    'Morden', 'Dauphin', 'The Pas',
  ],
  SK: [
    'Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford',
    'Estevan', 'Weyburn', 'Lloydminster',
  ],
  NS: [
    'Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Glace Bay', 'Kentville', 'Amherst',
    'Bridgewater', 'Yarmouth',
  ],
  NB: [
    'Moncton', 'Saint John', 'Fredericton', 'Dieppe', 'Miramichi', 'Edmundston', 'Bathurst', 'Campbellton',
    'Quispamsis', 'Riverview',
  ],
  NL: [
    "St. John's", 'Mount Pearl', 'Corner Brook', 'Grand Falls-Windsor', 'Gander', 'Paradise',
    'Conception Bay South', 'Happy Valley-Goose Bay', 'Labrador City', 'Stephenville',
  ],
  PE: [
    'Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague', 'Kensington', 'Souris',
  ],
  NT: ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchoko', 'Norman Wells'],
  YT: ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Carmacks', 'Mayo'],
  NU: ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay', 'Pangnirtung', 'Pond Inlet'],
};

const UK_CITIES: Record<string, string[]> = {
  'ENG-LON': [
    'London', 'Croydon', 'Bromley', 'Ealing', 'Enfield', 'Barnet', 'Croydon', 'Waltham Forest',
    'Redbridge', 'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth', 'Hammersmith',
    'Kensington', 'Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets', 'Newham',
    'Barking', 'Havering', 'Hillingdon', 'Hounslow', 'Kingston upon Thames', 'Merton', 'Sutton',
    'Richmond upon Thames', 'Harrow', 'Brent',
  ],
  'ENG-SE': [
    'Brighton', 'Reading', 'Oxford', 'Southampton', 'Portsmouth', 'Milton Keynes', 'Slough',
    'Basingstoke', 'Crawley', 'Maidstone', 'Canterbury', 'Guildford', 'Eastbourne', 'Worthing',
    'Hastings', 'Woking', 'High Wycombe', 'Aylesbury', 'Farnborough', 'Chatham', 'Gillingham',
  ],
  'ENG-SW': [
    'Bristol', 'Plymouth', 'Bournemouth', 'Poole', 'Swindon', 'Gloucester', 'Exeter', 'Cheltenham',
    'Bath', 'Taunton', 'Weston-super-Mare', 'Torquay', 'Salisbury', 'Truro', 'Yeovil', 'Weymouth',
  ],
  'ENG-EM': [
    'Nottingham', 'Leicester', 'Derby', 'Northampton', 'Lincoln', 'Loughborough', 'Mansfield',
    'Chesterfield', 'Boston', 'Kettering', 'Corby', 'Grantham', 'Worksop', 'Newark',
  ],
  'ENG-WM': [
    'Birmingham', 'Coventry', 'Wolverhampton', 'Stoke-on-Trent', 'Walsall', 'Dudley', 'Solihull',
    'Telford', 'West Bromwich', 'Worcester', 'Hereford', 'Nuneaton', 'Rugby', 'Tamworth', 'Stafford',
  ],
  'ENG-EE': [
    'Norwich', 'Ipswich', 'Cambridge', 'Peterborough', 'Luton', 'Colchester', 'Southend-on-Sea',
    'Basildon', 'Watford', 'Stevenage', 'Bedford', 'Chelmsford', 'Harlow', 'St Albans', 'Hemel Hempstead',
  ],
  'ENG-NE': [
    'Newcastle upon Tyne', 'Sunderland', 'Middlesbrough', 'Gateshead', 'Hartlepool', 'Darlington',
    'South Shields', 'Stockton-on-Tees', 'Durham', 'Washington', 'Blyth', 'Ashington', 'Redcar',
  ],
  'ENG-NW': [
    'Manchester', 'Liverpool', 'Bolton', 'Stockport', 'Salford', 'Oldham', 'Blackpool', 'Preston',
    'Warrington', 'Blackburn', 'Wigan', 'Rochdale', 'Bury', 'Burnley', 'Chester', 'Lancaster',
    'Crewe', 'Macclesfield', 'Southport', 'St Helens',
  ],
  'ENG-YH': [
    'Leeds', 'Sheffield', 'Bradford', 'Kingston upon Hull', 'York', 'Wakefield', 'Huddersfield',
    'Doncaster', 'Rotherham', 'Barnsley', 'Halifax', 'Scarborough', 'Harrogate', 'Grimsby', 'Scunthorpe',
  ],
  SCT: [
    'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Paisley',
    'East Kilbride', 'Livingston', 'Hamilton', 'Cumbernauld', 'Kirkcaldy', 'Dunfermline', 'Ayr',
    'Kilmarnock', 'Greenock', 'Dumfries', 'Falkirk', 'Motherwell',
  ],
  WLS: [
    'Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Bridgend', 'Llanelli',
    'Merthyr Tydfil', 'Bangor', 'Aberystwyth', 'Neath', 'Port Talbot', 'Cwmbran', 'Rhondda',
  ],
  NIR: [
    'Belfast', 'Londonderry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh',
    'Ballymena', 'Newtownards', 'Carrickfergus', 'Antrim', 'Coleraine', 'Omagh', 'Enniskillen',
    'Armagh', 'Dungannon',
  ],
};

// Dedupe UK London Croydon
UK_CITIES['ENG-LON'] = [...new Set(UK_CITIES['ENG-LON'])];

const AU_CITIES: Record<string, string[]> = {
  NSW: [
    'Sydney', 'Newcastle', 'Central Coast', 'Wollongong', 'Maitland', 'Wagga Wagga', 'Albury',
    'Port Macquarie', 'Tamworth', 'Orange', 'Dubbo', 'Bathurst', 'Lismore', 'Coffs Harbour', 'Nowra',
    'Queanbeyan', 'Broken Hill', 'Goulburn', 'Armidale', 'Griffith',
  ],
  VIC: [
    'Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Wodonga', 'Mildura', 'Warrnambool',
    'Frankston', 'Dandenong', 'Sunbury', 'Pakenham', 'Cranbourne', 'Sale', 'Traralgon', 'Horsham',
    'Latrobe', 'Wangaratta', 'Echuca', 'Moe',
  ],
  QLD: [
    'Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Mackay',
    'Rockhampton', 'Bundaberg', 'Hervey Bay', 'Gladstone', 'Mount Isa', 'Maryborough', 'Ipswich',
    'Logan', 'Redcliffe', 'Caboolture',
  ],
  WA: [
    'Perth', 'Mandurah', 'Bunbury', 'Geraldton', 'Kalgoorlie', 'Albany', 'Busselton', 'Karratha',
    'Port Hedland', 'Broome', 'Rockingham', 'Joondalup', 'Fremantle',
  ],
  SA: [
    'Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Lincoln',
    'Port Pirie', 'Victor Harbor', 'Gawler', 'Mount Barker',
  ],
  TAS: [
    'Hobart', 'Launceston', 'Devonport', 'Burnie', 'Ulverstone', 'Kingston', 'Glenorchy', 'New Norfolk',
  ],
  ACT: ['Canberra', 'Belconnen', 'Tuggeranong', 'Gungahlin', 'Woden', 'Queanbeyan'],
  NT: ['Darwin', 'Alice Springs', 'Palmerston', 'Katherine', 'Nhulunbuy', 'Tennant Creek'],
};

// Fix UT duplicate St. George
US_CITIES.UT = [...new Set(US_CITIES.UT!.map((c) => (c === 'St. George' ? 'Saint George' : c)))];

// Fix BC duplicate Chilliwack
CA_CITIES.BC = [...new Set(CA_CITIES.BC!)];

const root = path.join(process.cwd(), 'src/lib/geo/cities');
fs.mkdirSync(root, { recursive: true });
writeTs(path.join(root, 'us.ts'), 'US_CITIES', US_CITIES);
writeTs(path.join(root, 'ca.ts'), 'CA_CITIES', CA_CITIES);
writeTs(path.join(root, 'uk.ts'), 'UK_CITIES', UK_CITIES);
writeTs(path.join(root, 'au.ts'), 'AU_CITIES', AU_CITIES);

let total = 0;
for (const c of Object.values(US_CITIES)) total += c.length;
console.log('US cities:', total);
console.log('Done.');

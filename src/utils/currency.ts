export interface CurrencyInfo {
  code: string;       // e.g., 'NGN'
  symbol: string;     // e.g., '₦'
  name: string;       // e.g., 'Nigerian Naira'
  country: string;    // e.g., 'Nigeria'
}

export const DEFAULT_CURRENCY: CurrencyInfo = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  country: 'United States'
};

// Map normalized lower-case country names and aliases to currency info
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // Africa
  'nigeria': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  'ghana': { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  'kenya': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  'south africa': { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  'egypt': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt' },
  'rwanda': { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', country: 'Rwanda' },
  'uganda': { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
  'tanzania': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
  'ethiopia': { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
  'zambia': { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', country: 'Zambia' },
  'cameroon': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Cameroon' },
  'senegal': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Senegal' },
  'ivory coast': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Ivory Coast' },
  "cote d'ivoire": { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Ivory Coast' },
  'benin': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Benin' },
  'mali': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Mali' },
  'burkina faso': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Burkina Faso' },
  'togo': { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Togo' },

  // Americas
  'united states': { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  'usa': { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  'us': { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  'canada': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  'brazil': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  'mexico': { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', country: 'Mexico' },
  'colombia': { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', country: 'Colombia' },
  'argentina': { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', country: 'Argentina' },
  'chile': { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', country: 'Chile' },
  'peru': { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'Peru' },

  // Europe
  'united kingdom': { code: 'GBP', symbol: '£', name: 'British Pound Sterling', country: 'United Kingdom' },
  'uk': { code: 'GBP', symbol: '£', name: 'British Pound Sterling', country: 'United Kingdom' },
  'great britain': { code: 'GBP', symbol: '£', name: 'British Pound Sterling', country: 'United Kingdom' },
  'european union': { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  'germany': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Germany' },
  'france': { code: 'EUR', symbol: '€', name: 'Euro', country: 'France' },
  'italy': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Italy' },
  'spain': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Spain' },
  'netherlands': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Netherlands' },
  'belgium': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Belgium' },
  'austria': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Austria' },
  'ireland': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Ireland' },
  'portugal': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Portugal' },
  'greece': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Greece' },
  'finland': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Finland' },
  'slovakia': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Slovakia' },
  'slovenia': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Slovenia' },
  'estonia': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Estonia' },
  'latvia': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Latvia' },
  'lithuania': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Lithuania' },
  'cyprus': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Cyprus' },
  'malta': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Malta' },
  'luxembourg': { code: 'EUR', symbol: '€', name: 'Euro', country: 'Luxembourg' },
  'switzerland': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  'sweden': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  'norway': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  'denmark': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  'poland': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'Poland' },
  'czech republic': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  'czechia': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  'hungary': { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
  'romania': { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
  'turkey': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },

  // Asia Pacific
  'australia': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  'new zealand': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  'japan': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  'china': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  'india': { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  'singapore': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  'malaysia': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  'indonesia': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  'philippines': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  'pakistan': { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', country: 'Pakistan' },
  'bangladesh': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  'vietnam': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  'thailand': { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  'south korea': { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },

  // Middle East
  'united arab emirates': { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates' },
  'uae': { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates' },
  'saudi arabia': { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  'qatar': { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', country: 'Qatar' },
  'israel': { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', country: 'Israel' },
};

// Map Currency Codes to Currency Info
export const CURRENCY_CODE_MAP: Record<string, CurrencyInfo> = {
  'USD': { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  'NGN': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  'GHS': { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  'KES': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  'ZAR': { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  'GBP': { code: 'GBP', symbol: '£', name: 'British Pound Sterling', country: 'United Kingdom' },
  'EUR': { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  'CAD': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  'CHF': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  'AED': { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates' },
  'SAR': { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  'QAR': { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', country: 'Qatar' },
  'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  'MYR': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  'TRY': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  'BRL': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  'MXN': { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', country: 'Mexico' },
  'EGP': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt' },
  'SEK': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  'NOK': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  'DKK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  'PLN': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'Poland' },
  'IDR': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  'PHP': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  'PKR': { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', country: 'Pakistan' },
  'BDT': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  'VND': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  'THB': { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  'KRW': { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' }
};

export const POPULAR_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Switzerland',
  'Japan',
  'China',
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Singapore',
  'Malaysia',
  'Turkey',
  'Brazil',
  'Mexico',
  'Egypt',
  'Indonesia',
  'Philippines',
  'Pakistan',
  'Bangladesh',
  'Sweden',
  'Norway'
];

/**
 * Initializes the currency maps dynamically from the database.
 * Call this function early in your application lifecycle (e.g., App.tsx).
 */
export async function initializeCurrencies(supabaseClient: any) {
  try {
    const { data: dbCountries, error } = await supabaseClient
      .from('supported_countries')
      .select('*')
      .eq('is_active', true);
      
    if (error || !dbCountries) {
      if (error && error.code === 'PGRST205') {
        console.log('[CurrencyMap] supported_countries table not found. Using default currency maps until migration is applied.');
      } else {
        console.log('[CurrencyMap] Failed to initialize dynamic currencies:', error?.message);
      }
      return;
    }

    // Merge database entries into local mappings
    for (const c of dbCountries) {
      const countryKey = c.country_name.trim().toLowerCase();
      const codeUpper = c.currency_code.trim().toUpperCase();
      
      const newInfo: CurrencyInfo = {
        code: codeUpper,
        symbol: c.currency_symbol,
        name: `${c.country_name} ${codeUpper}`,
        country: c.country_name
      };

      // Update maps
      COUNTRY_CURRENCY_MAP[countryKey] = newInfo;
      CURRENCY_CODE_MAP[codeUpper] = newInfo;
      
      // Update POPULAR_COUNTRIES if not present
      if (!POPULAR_COUNTRIES.includes(c.country_name)) {
        POPULAR_COUNTRIES.push(c.country_name);
      }
    }
    
    console.log('[CurrencyMap] Dynamically loaded', dbCountries.length, 'supported countries.');
  } catch (err) {
    console.log('[CurrencyMap] Error initializing currencies:', err);
  }
}

/**
 * Automatically maps country name to currency information.
 * If country is missing or unrecognized, defaults to USD and logs event.
 */
export function getCurrencyByCountry(countryName?: string): CurrencyInfo {
  if (!countryName || typeof countryName !== 'string') {
    console.log('[CurrencyMap] Empty or invalid country input -> defaulting to USD');
    return DEFAULT_CURRENCY;
  }

  const clean = countryName.trim().toLowerCase();
  if (!clean) {
    console.log('[CurrencyMap] Blank country string -> defaulting to USD');
    return DEFAULT_CURRENCY;
  }

  // Exact or alias match
  if (COUNTRY_CURRENCY_MAP[clean]) {
    return COUNTRY_CURRENCY_MAP[clean];
  }

  // Substring match
  for (const [key, info] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return info;
    }
  }

  console.log(`[CurrencyMap] Country "${countryName}" unavailable in mapping table -> defaulting to USD`);
  return DEFAULT_CURRENCY;
}

/**
 * Retrieves currency information by currency code or country name.
 */
export function getCurrencyInfo(codeOrCountry?: string): CurrencyInfo {
  if (!codeOrCountry || typeof codeOrCountry !== 'string') {
    return DEFAULT_CURRENCY;
  }

  const upper = codeOrCountry.trim().toUpperCase();
  if (CURRENCY_CODE_MAP[upper]) {
    return CURRENCY_CODE_MAP[upper];
  }

  // Check by country
  return getCurrencyByCountry(codeOrCountry);
}

/**
 * Get currency symbol for a currency code, country, or currency object.
 */
export function getCurrencySymbol(codeOrCountryOrInfo?: string | CurrencyInfo): string {
  if (!codeOrCountryOrInfo) return '$';
  if (typeof codeOrCountryOrInfo === 'object') return codeOrCountryOrInfo.symbol || '$';

  const info = getCurrencyInfo(codeOrCountryOrInfo);
  return info.symbol || '$';
}

/**
 * Formats a financial amount with currency symbol and optional currency code.
 */
export function formatCurrencyAmount(
  amount: number | string | undefined | null,
  currencyOrCountry?: string | CurrencyInfo,
  options: { includeCode?: boolean; decimals?: number } = {}
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0)) || 0;
  const decimals = options.decimals !== undefined ? options.decimals : 2;

  let info: CurrencyInfo = DEFAULT_CURRENCY;
  if (typeof currencyOrCountry === 'object' && currencyOrCountry) {
    info = currencyOrCountry;
  } else if (typeof currencyOrCountry === 'string' && currencyOrCountry) {
    info = getCurrencyInfo(currencyOrCountry);
  }

  const formattedNum = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const sign = num < 0 ? '-' : '';
  const base = `${info.symbol}${formattedNum}`;

  if (options.includeCode) {
    return `${sign}${base} ${info.code}`;
  }
  return `${sign}${base}`;
}

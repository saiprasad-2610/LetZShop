import {
  isValidPin,
  isValidIndianPhone,
  isValidIndianMobile,
  isValidEmail,
  isValidBusinessName,
  getIndianStateNames,
  getCitiesForState,
  OTHER_CITY_OPTION,
  normalizePhone,
  toLocalDigits,
} from '@simply/validation';

describe('Merchant Flow 01B — PIN & Input Validation Unit Tests', () => {
  describe('1. PIN Validation (Canonical regex ^\\d{6}$)', () => {
    it('rejects 4-digit PIN', () => {
      expect(isValidPin('1234')).toBe(false);
      expect(isValidPin('8492')).toBe(false);
    });

    it('rejects 5-digit PIN', () => {
      expect(isValidPin('12345')).toBe(false);
      expect(isValidPin('98765')).toBe(false);
    });

    it('rejects 7-digit PIN', () => {
      expect(isValidPin('1234567')).toBe(false);
    });

    it('rejects letters and symbols in PIN', () => {
      expect(isValidPin('1234ab')).toBe(false);
      expect(isValidPin('abcdef')).toBe(false);
      expect(isValidPin('12 456')).toBe(false);
      expect(isValidPin('12-456')).toBe(false);
    });

    it('accepts exact 6-digit numeric PIN', () => {
      expect(isValidPin('123456')).toBe(true);
      expect(isValidPin('849261')).toBe(true);
      expect(isValidPin('000000')).toBe(true);
      expect(isValidPin('999999')).toBe(true);
    });
  });

  describe('2. Confirm PIN Logic', () => {
    it('blocks confirmation when PINs do not match', () => {
      const pin: string = '123456';
      const confirmPin: string = '123457';
      const isMatch = pin === confirmPin && isValidPin(pin) && isValidPin(confirmPin);
      expect(isMatch).toBe(false);
    });

    it('allows confirmation only when both are 6 digits and match exactly', () => {
      const pin: string = '849261';
      const confirmPin: string = '849261';
      const isMatch = pin === confirmPin && isValidPin(pin) && isValidPin(confirmPin);
      expect(isMatch).toBe(true);
    });
  });

  describe('3. Indian Mobile Phone Validation & Canonical Payload', () => {
    it('validates exactly 10 local digits starting with 6-9', () => {
      expect(isValidIndianMobile('9876543210')).toBe(true);
      expect(isValidIndianMobile('8123456789')).toBe(true);
      expect(isValidIndianMobile('7000000000')).toBe(true);
      expect(isValidIndianMobile('6999999999')).toBe(true);

      // Invalid local numbers
      expect(isValidIndianMobile('5123456789')).toBe(false); // starts with 5
      expect(isValidIndianMobile('987654321')).toBe(false);  // 9 digits
      expect(isValidIndianMobile('98765432100')).toBe(false); // 11 digits
      expect(isValidIndianMobile('abcdefghij')).toBe(false);
    });

    it('formats to canonical +91XXXXXXXXXX payload', () => {
      expect(normalizePhone('9876543210')).toBe('+919876543210');
      expect(normalizePhone('+919876543210')).toBe('+919876543210');
      expect(normalizePhone('919876543210')).toBe('+919876543210');
    });

    it('typing "1" → visible value "1" (NOT "911")', () => {
      const typed = '1';
      const visible = toLocalDigits(typed);
      expect(visible).toBe('1');
      expect(visible).not.toBe('911');

      // When parent receives canonical and re-renders:
      const canonical = `+91${visible}`;
      expect(canonical).toBe('+911');
      expect(toLocalDigits(canonical)).toBe('1');
      expect(toLocalDigits(canonical)).not.toBe('911');
    });

    it('typing "9" → visible value "9" (NOT "919")', () => {
      const typed = '9';
      const visible = toLocalDigits(typed);
      expect(visible).toBe('9');
      expect(visible).not.toBe('919');

      // When parent receives canonical and re-renders:
      const canonical = `+91${visible}`;
      expect(canonical).toBe('+919');
      expect(toLocalDigits(canonical)).toBe('9');
      expect(toLocalDigits(canonical)).not.toBe('919');
    });

    it('typing sequentially: 9876543210 → visible exactly 9876543210 → canonical +919876543210', () => {
      let currentTyped = '';
      const full = '9876543210';
      for (const char of full) {
        currentTyped += char;
        const visible = toLocalDigits(currentTyped);
        expect(visible).toBe(currentTyped);
        const canonical = `+91${visible}`;
        // Parent echo normalization back to input must remain the exact visible typed digits
        expect(toLocalDigits(canonical)).toBe(currentTyped);
      }
      expect(toLocalDigits(currentTyped)).toBe('9876543210');
      expect(`+91${toLocalDigits(currentTyped)}`).toBe('+919876543210');
    });

    it('local number beginning 91: 9123456789 → stays 9123456789 (not 23456789)', () => {
      expect(toLocalDigits('9123456789')).toBe('9123456789');
      expect(toLocalDigits('+919123456789')).toBe('9123456789');
      expect(toLocalDigits('9123456789')).not.toBe('23456789');
    });

    it('paste: +919876543210 → visible 9876543210', () => {
      expect(toLocalDigits('+919876543210')).toBe('9876543210');
    });

    it('paste: 919876543210 → visible 9876543210', () => {
      expect(toLocalDigits('919876543210')).toBe('9876543210');
    });

    it('paste: 9876543210 → visible 9876543210', () => {
      expect(toLocalDigits('9876543210')).toBe('9876543210');
    });

    it('letters and symbols are removed', () => {
      expect(toLocalDigits('abc 987-654 def (3210)')).toBe('9876543210');
      expect(toLocalDigits('+91-98765-43210')).toBe('9876543210');
    });

    it('11th digit is ignored', () => {
      expect(toLocalDigits('98765432105')).toBe('9876543210');
    });

    it('proves canonical +919370262662 is valid with isValidIndianPhone', () => {
      expect(isValidIndianPhone('+919370262662')).toBe(true);
    });

    it('proves 9370262662 can normalize to canonical and becomes valid', () => {
      const raw = '9370262662';
      const canonical = normalizePhone(raw);
      expect(canonical).toBe('+919370262662');
      expect(isValidIndianPhone(canonical)).toBe(true);
      expect(isValidIndianPhone(raw)).toBe(true);
    });

    it('proves 9-digit number is invalid', () => {
      expect(isValidIndianPhone('937026266')).toBe(false);
      expect(isValidIndianPhone('+91937026266')).toBe(false);
      expect(isValidIndianMobile('937026266')).toBe(false);
    });

    it('proves 11-digit local number is invalid', () => {
      expect(isValidIndianPhone('93702626621')).toBe(false);
      expect(isValidIndianPhone('+9193702626621')).toBe(false);
      expect(isValidIndianMobile('93702626621')).toBe(false);
    });
  });

  describe('4. Email Validation', () => {
    it('rejects malformed emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user@domain.')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user space@domain.com')).toBe(false);
    });

    it('accepts valid email addresses with trim and lowercase handling', () => {
      expect(isValidEmail('merchant@example.com')).toBe(true);
      expect(isValidEmail('  merchant.support@store.in  ')).toBe(true);
      expect(isValidEmail('contact+tag@biz.co.in')).toBe(true);
    });

    it('handles empty optional email cleanly', () => {
      const emailInput = '   ';
      const cleanEmail = emailInput.trim().toLowerCase() || undefined;
      expect(cleanEmail).toBeUndefined();
    });
  });

  describe('5. Business Name Validation', () => {
    it('accepts authentic Indian and business names with common punctuation', () => {
      expect(isValidBusinessName('Shree Ganesh Foods')).toBe(true);
      expect(isValidBusinessName('A-1 Electronics')).toBe(true);
      expect(isValidBusinessName('R.K. Enterprises')).toBe(true);
      expect(isValidBusinessName("Maa's Kitchen")).toBe(true);
      expect(isValidBusinessName('SK Traders & Co.')).toBe(true);
      expect(isValidBusinessName('Om Sai Fashion / Boutique')).toBe(true);
      expect(isValidBusinessName('Mahalakshmi (India) Ltd.')).toBe(true);
    });

    it('rejects empty or excessively short/long business names', () => {
      expect(isValidBusinessName('')).toBe(false);
      expect(isValidBusinessName(' ')).toBe(false);
      expect(isValidBusinessName('A')).toBe(false); // only 1 char
      expect(isValidBusinessName('A'.repeat(101))).toBe(false);
    });
  });

  describe('6. Indian States & Cities Selection', () => {
    it('contains all 28 states and 8 union territories (36 total)', () => {
      const states = getIndianStateNames();
      expect(states.length).toBe(36);
      expect(states).toContain('Gujarat');
      expect(states).toContain('Maharashtra');
      expect(states).toContain('Karnataka');
      expect(states).toContain('Delhi');
      expect(states).toContain('Tamil Nadu');
      expect(states).toContain('Jammu and Kashmir');
      expect(states).toContain('Ladakh');
    });

    it('returns city list for state including Other city option', () => {
      const gujaratCities = getCitiesForState('Gujarat');
      expect(gujaratCities).toContain('Ahmedabad');
      expect(gujaratCities).toContain('Surat');
      expect(gujaratCities).toContain(OTHER_CITY_OPTION);

      const maharashtraCities = getCitiesForState('Maharashtra');
      expect(maharashtraCities).toContain('Mumbai');
      expect(maharashtraCities).toContain('Pune');
      expect(maharashtraCities).toContain(OTHER_CITY_OPTION);
    });

    it('validates state and city requirement logic', () => {
      // Step 4 is invalid without state
      const stateSelected = '';
      const citySelected = '';
      expect(Boolean(stateSelected)).toBe(false);

      // City requires state
      const citiesWhenEmpty = getCitiesForState('');
      expect(citiesWhenEmpty).toEqual([OTHER_CITY_OPTION]);

      // When "Other city" selected, custom city name is required
      const cityChoice = OTHER_CITY_OPTION;
      const customCityEmpty = '   ';
      const isCustomCityValid = cityChoice === OTHER_CITY_OPTION ? Boolean(customCityEmpty.trim()) : true;
      expect(isCustomCityValid).toBe(false);

      const customCityFilled = 'Bardoli';
      const isCustomCityValidFilled = cityChoice === OTHER_CITY_OPTION ? Boolean(customCityFilled.trim()) : true;
      expect(isCustomCityValidFilled).toBe(true);
    });
  });

  describe('7. Form Button Enablement Conditions', () => {
    // Helper mimicking Login/Registration/Recovery/Onboarding button enablement
    const isLoginButtonDisabled = (phone: string, pin: string, loading = false) =>
      loading || !isValidIndianPhone(phone) || !isValidPin(pin);

    const isRegistrationButtonDisabled = (phone: string, loading = false) =>
      loading || !isValidIndianPhone(phone);

    const isRecoveryButtonDisabled = (phone: string, loading = false) =>
      loading || !isValidIndianPhone(phone);

    it('REGISTRATION: visible "9370262662", parent canonical "+919370262662" -> Send Verification OTP ENABLED', () => {
      const visible = '9370262662';
      const canonical = `+91${visible}`;
      expect(toLocalDigits(canonical)).toBe(visible);
      expect(canonical).toBe('+919370262662');
      expect(isRegistrationButtonDisabled(canonical)).toBe(false); // ENABLED
    });

    it('LOGIN: canonical phone "+919370262662" + PIN "654321" -> Log In to Dashboard ENABLED', () => {
      const phone = '+919370262662';
      const pin = '654321';
      expect(isLoginButtonDisabled(phone, pin)).toBe(false); // ENABLED
    });

    it('INVALID PHONE: "937026266" (9 digits) -> buttons DISABLED', () => {
      const invalidPhone = '937026266';
      expect(isRegistrationButtonDisabled(invalidPhone)).toBe(true); // DISABLED
      expect(isRecoveryButtonDisabled(invalidPhone)).toBe(true);     // DISABLED
      expect(isLoginButtonDisabled(invalidPhone, '654321')).toBe(true); // DISABLED
    });

    it('VALID PHONE + 5-DIGIT PIN: phone "+919370262662" + PIN "65432" -> login DISABLED', () => {
      const phone = '+919370262662';
      const pin = '65432';
      expect(isLoginButtonDisabled(phone, pin)).toBe(true); // DISABLED
    });

    it('VALID PHONE + 6-DIGIT PIN WITH NON-DIGITS: PIN "65432a" -> login DISABLED', () => {
      const phone = '+919370262662';
      const pin = '65432a';
      expect(isLoginButtonDisabled(phone, pin)).toBe(true); // DISABLED
    });

    it('VALID PHONE + 6-DIGIT PIN: phone "+919370262662" + PIN "654321" -> login ENABLED', () => {
      const phone = '+919370262662';
      const pin = '654321';
      expect(isLoginButtonDisabled(phone, pin)).toBe(false); // ENABLED
    });
  });

  describe('8. Existing Account Detection & Auth Route Protection Logic', () => {
    // Pure function modeling registration OTP request decision
    interface MockAccount {
      phone: string;
      hasPin: boolean;
      hasStore: boolean;
    }

    const evaluateRegisterOtpRequest = (phone: string, accounts: MockAccount[]) => {
      if (!isValidIndianPhone(phone)) {
        return { status: 400, code: 'VALIDATION_FAILED' };
      }
      const existing = accounts.find((a) => a.phone === phone);
      if (existing && existing.hasPin) {
        return {
          status: 409,
          code: 'ACCOUNT_EXISTS',
          message: 'An account already exists with this mobile number. Please log in.',
        };
      }
      return { status: 200, challengeCreated: true };
    };

    // Pure function modeling login post-auth redirect
    const resolveLoginRedirect = (user: { id: string } | null, store: { id: string } | null) => {
      if (!user) return '/login';
      return store ? '/' : '/onboarding';
    };

    // Pure function modeling route protection when opening /login or /login?mode=register
    const resolveRouteProtection = (
      user: { id: string } | null,
      store: { id: string } | null,
      targetQueryMode?: string
    ) => {
      if (user) {
        return store ? '/' : '/onboarding';
      }
      return targetQueryMode === 'register' ? 'REGISTER_OTP' : 'PIN_LOGIN';
    };

    const mockAccounts: MockAccount[] = [
      { phone: '+919370262662', hasPin: true, hasStore: true },    // Active seller with store & PIN
      { phone: '+919876543210', hasPin: true, hasStore: false },   // Seller with PIN, onboarding incomplete
      { phone: '+919999988888', hasPin: false, hasStore: false },  // Partially created user (no PIN)
    ];

    it('CASE A: New phone -> request registration OTP -> 200 -> normal registration allowed', () => {
      const res = evaluateRegisterOtpRequest('+919123456789', mockAccounts);
      expect(res.status).toBe(200);
      expect(res.challengeCreated).toBe(true);
    });

    it('CASE B: Existing merchant with PIN -> request registration OTP -> 409 ACCOUNT_EXISTS -> OTP is NOT generated', () => {
      const res = evaluateRegisterOtpRequest('+919370262662', mockAccounts);
      expect(res.status).toBe(409);
      expect(res.code).toBe('ACCOUNT_EXISTS');
      expect(res.message).toBe('An account already exists with this mobile number. Please log in.');
      expect((res as any).challengeCreated).toBeUndefined();
    });

    it('Partial registration: Existing user without PIN -> request registration OTP -> 200 allowed to complete PIN', () => {
      const res = evaluateRegisterOtpRequest('+919999988888', mockAccounts);
      expect(res.status).toBe(200);
      expect(res.challengeCreated).toBe(true);
    });

    it('CASE C: Existing ACTIVE_SELLER logs in -> redirects to Seller Home (/)', () => {
      const user = { id: 'usr_seller_1' };
      const store = { id: 'str_store_1' };
      expect(resolveLoginRedirect(user, store)).toBe('/');
    });

    it('CASE D: Existing ONBOARDING_REQUIRED seller logs in -> redirects to /onboarding', () => {
      const user = { id: 'usr_seller_2' };
      const store = null;
      expect(resolveLoginRedirect(user, store)).toBe('/onboarding');
    });

    it('CASE E: Already authenticated ACTIVE_SELLER opens register route -> redirects to Seller Home (/)', () => {
      const user = { id: 'usr_seller_1' };
      const store = { id: 'str_store_1' };
      expect(resolveRouteProtection(user, store, 'register')).toBe('/');
    });

    it('CASE F: Already authenticated ONBOARDING_REQUIRED user opens register route -> redirects to /onboarding', () => {
      const user = { id: 'usr_seller_2' };
      const store = null;
      expect(resolveRouteProtection(user, store, 'register')).toBe('/onboarding');
    });

    it('CASE G: Frontend receives ACCOUNT_EXISTS -> switches to PIN_LOGIN and preserves phone', () => {
      // Simulate frontend state transition on ACCOUNT_EXISTS
      let mode = 'REGISTER_OTP';
      let phone = '+919370262662';
      let accountExists = false;
      let error: string | null = null;

      // API responds with 409 ACCOUNT_EXISTS
      const apiError = { code: 'ACCOUNT_EXISTS', status: 409 };
      if (apiError.code === 'ACCOUNT_EXISTS' || apiError.status === 409) {
        accountExists = true;
        error = null;
      }

      expect(accountExists).toBe(true);
      expect(error).toBeNull();
      expect(phone).toBe('+919370262662');

      // User clicks "Log In with PIN" CTA
      const switchToPinLogin = () => {
        accountExists = false;
        error = null;
        mode = 'PIN_LOGIN';
        // phone is NOT cleared
      };

      switchToPinLogin();

      expect(mode).toBe('PIN_LOGIN');
      expect(accountExists).toBe(false);
      expect(phone).toBe('+919370262662'); // Phone is retained
    });
  });
});

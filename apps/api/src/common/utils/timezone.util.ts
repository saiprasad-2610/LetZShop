/**
 * Centralized Indian Launch Timezone Utility (Asia/Kolkata, UTC+05:30)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export interface PeriodDateRange {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  groupBy: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Returns the current date shifted to IST representation
 */
export function getNowInIst(): Date {
  return new Date();
}

/**
 * Parses a dashboard period string into exact UTC Date boundaries reflecting Asia/Kolkata calendar days.
 */
export function parseDashboardPeriod(
  periodKey: string = '30d',
  customStart?: string,
  customEnd?: string
): PeriodDateRange {
  const now = new Date();
  const normalizedKey = (periodKey || '30d').toLowerCase().trim();

  // Calculate IST today midnight in UTC
  const nowIstMs = now.getTime() + IST_OFFSET_MS;
  const istDateObj = new Date(nowIstMs);
  const istYear = istDateObj.getUTCFullYear();
  const istMonth = istDateObj.getUTCMonth();
  const istDay = istDateObj.getUTCDate();

  // UTC timestamp corresponding to today 00:00:00 IST
  const todayStartUtcMs = Date.UTC(istYear, istMonth, istDay) - IST_OFFSET_MS;
  const todayStart = new Date(todayStartUtcMs);

  switch (normalizedKey) {
    case 'today': {
      const startDate = todayStart;
      const endDate = now;
      const durationMs = Math.max(1000, endDate.getTime() - startDate.getTime());
      const previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      const previousEndDate = new Date(previousStartDate.getTime() + durationMs);

      return {
        key: 'today',
        label: 'Today',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'hour',
      };
    }

    case '7d': {
      const days = 7;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const endDate = now;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = startDate;

      return {
        key: '7d',
        label: '7 Days',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'day',
      };
    }

    case '3m': {
      const days = 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const endDate = now;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = startDate;

      return {
        key: '3m',
        label: '3 Months',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'week',
      };
    }

    case '6m': {
      const days = 180;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const endDate = now;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = startDate;

      return {
        key: '6m',
        label: '6 Months',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'month',
      };
    }

    case '1y': {
      const days = 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const endDate = now;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = startDate;

      return {
        key: '1y',
        label: '1 Year',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'month',
      };
    }

    case 'custom': {
      let start = customStart ? new Date(customStart) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      let end = customEnd ? new Date(customEnd) : now;
      if (isNaN(start.getTime())) start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (isNaN(end.getTime())) end = now;
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }
      const durationMs = Math.max(1000, end.getTime() - start.getTime());
      const previousStartDate = new Date(start.getTime() - durationMs);
      const previousEndDate = start;

      const durationDays = durationMs / (24 * 60 * 60 * 1000);
      let groupBy: 'hour' | 'day' | 'week' | 'month' = 'day';
      if (durationDays <= 1) groupBy = 'hour';
      else if (durationDays <= 35) groupBy = 'day';
      else if (durationDays <= 120) groupBy = 'week';
      else groupBy = 'month';

      return {
        key: 'custom',
        label: 'Custom',
        startDate: start,
        endDate: end,
        previousStartDate,
        previousEndDate,
        groupBy,
      };
    }

    case '30d':
    default: {
      const days = 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const endDate = now;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = startDate;

      return {
        key: '30d',
        label: '30 Days',
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        groupBy: 'day',
      };
    }
  }
}

/**
 * Formats a Date object to an IST date string: YYYY-MM-DD
 */
export function formatIstDate(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to IST hour string: HH:00
 */
export function formatIstHour(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const hour = String(istDate.getUTCHours()).padStart(2, '0');
  return `${hour}:00`;
}

/**
 * Formats a Date object to IST month string: YYYY-MM
 */
export function formatIstMonth(date: Date): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

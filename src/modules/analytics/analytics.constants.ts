export const ANALYTICS_QUEUE = 'analytics-queue';
export const RECORD_CLICK_JOB = 'record-click-job';

export interface ClickEventPayload {
    linkId: string;
    ip: string;
    userAgent: string;
    referrer?: string;
    timestamp: string;
}
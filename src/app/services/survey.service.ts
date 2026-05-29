import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { Survey, SurveyResponse } from '../models/survey.model';

@Injectable({ providedIn: 'root' })
export class SurveyService {
    private readonly baseUrl = '/api';

    constructor(private http: HttpClient) { }

    // ---- Surveys ----
    getAllSurveys(): Observable<Survey[]> {
        return this.http.get<Survey[]>(`${this.baseUrl}/surveys`);
    }

    getSurveyById(id: string): Observable<Survey> {
        return this.http.get<Survey>(`${this.baseUrl}/surveys`, { params: { id } });
    }

    getSurveyByCompany(company: string): Observable<Survey> {
        return this.http.get<Survey>(`${this.baseUrl}/surveys`, { params: { company } });
    }

    createSurvey(survey: Survey): Observable<Survey> {
        return this.http.post<Survey>(`${this.baseUrl}/surveys`, survey);
    }

    updateSurvey(survey: Survey): Observable<any> {
        return this.http.put(`${this.baseUrl}/surveys`, survey);
    }

    deleteSurvey(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/surveys`, { params: { id } });
    }

    // ---- Responses ----
    getResponsesBySurvey(surveyId: string): Observable<SurveyResponse[]> {
        return this.http.get<SurveyResponse[]>(`${this.baseUrl}/responses`, { params: { surveyId } });
    }

    getResponseById(id: string): Observable<SurveyResponse> {
        return this.http.get<SurveyResponse>(`${this.baseUrl}/responses`, { params: { id } });
    }

    submitResponse(response: SurveyResponse): Observable<SurveyResponse> {
        return this.http.post<SurveyResponse>(`${this.baseUrl}/responses`, response);
    }

    updateResponse(id: string, answers: { [questionId: string]: string | string[] }): Observable<any> {
        return this.http.put(`${this.baseUrl}/responses`, { id, answers });
    }

    deleteResponse(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/responses`, { params: { id } });
    }

    sendEmail(data: { email: string; name: string; templateId?: string; subject?: string; body?: string; responseId?: string, surveyId?: string, bookingDate?: string, bookingTime?: string, company?: string }): Observable<any> {
        return this.http.post(`${this.baseUrl}/send-email`, data);
    }

    // ---- Calendar & Bookings (Cal.com) ----
    getEventTypes(): Observable<any> {
        return this.http.get(`${this.baseUrl}/cal`, { params: { endpoint: 'event-types' } });
    }

    createBooking(booking: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/cal`, booking);
    }

    getBookings(date?: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/cal`, { params: { endpoint: 'bookings' } });
    }

    deleteBooking(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/cal`, { params: { id } });
    }

    // ---- Email Templates ----
    getEmailTemplates(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/email-templates-api`);
    }

    updateEmailTemplate(template: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/email-templates-api`, template);
    }

    deleteEmailTemplate(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/email-templates-api`, { params: { id } });
    }
}

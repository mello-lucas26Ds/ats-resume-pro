import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TestSuiteReport } from '../types/ats.types';
import { executeClientTestSuite } from '../utils/test-suite-runner';

@Injectable({
  providedIn: 'root',
})
export class TestSuiteService {
  private http = inject(HttpClient);

  isRunningTests = signal<boolean>(false);
  testReport = signal<TestSuiteReport | null>(null);
  errorMessage = signal<string | null>(null);

  runTests(): void {
    this.isRunningTests.set(true);
    this.errorMessage.set(null);

    this.http.post<TestSuiteReport>('/api/run-tests', {}).subscribe({
      next: (report) => {
        this.testReport.set(report);
        this.isRunningTests.set(false);
      },
      error: () => {
        // Instant local fallback runner for static / offline environments
        try {
          const report = executeClientTestSuite();
          this.testReport.set(report);
        } catch (err) {
          console.error('Erro na execução dos testes:', err);
          this.errorMessage.set('Não foi possível rodar a suíte de testes automáticos.');
        } finally {
          this.isRunningTests.set(false);
        }
      },
    });
  }
}

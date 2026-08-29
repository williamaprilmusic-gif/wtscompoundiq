// src/components/StartHere.jsx
import React, { useState } from 'react';
import './StartHere.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const StartHere = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState({});

  const QUESTIONS = [
    { key: 'hasHighInterestDebt', text: t('startHere.q1') },
    { key: 'hasEmergencyFund', text: t('startHere.q2') },
    { key: 'isInvestingRegularly', text: t('startHere.q3') }
  ];

  const allAnswered = QUESTIONS.every(q => answers[q.key] !== undefined);

  const setAnswer = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  const getRecommendation = () => {
    if (answers.hasHighInterestDebt) {
      return { title: t('startHere.rec1Title'), body: t('startHere.rec1Body'), cta: t('startHere.rec1Cta'), tab: 'Debt Payoff' };
    }
    if (!answers.hasEmergencyFund) {
      return { title: t('startHere.rec2Title'), body: t('startHere.rec2Body'), cta: t('startHere.rec2Cta'), tab: 'Emergency Fund' };
    }
    if (!answers.isInvestingRegularly) {
      return { title: t('startHere.rec3Title'), body: t('startHere.rec3Body'), cta: t('startHere.rec3Cta'), tab: 'Invest' };
    }
    return { title: t('startHere.rec4Title'), body: t('startHere.rec4Body'), cta: t('startHere.rec4Cta'), tab: 'Tax Optimizer' };
  };

  return (
    <div className="card start-here">
      <div className="start-header">
        <h2>{t('startHere.title')}</h2>
        <p>{t('startHere.subtitle')}</p>
      </div>

      <div className="start-language">
        <span className="start-language-label">{t('startHere.changeLanguage')}</span>
        <LanguageSwitcher />
      </div>

      <div className="start-questions">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="start-question">
            <span>{q.text}</span>
            <div className="start-toggle">
              <button className={answers[q.key] === true ? 'active' : ''} onClick={() => setAnswer(q.key, true)}>{t('common.yes')}</button>
              <button className={answers[q.key] === false ? 'active' : ''} onClick={() => setAnswer(q.key, false)}>{t('common.no')}</button>
            </div>
          </div>
        ))}
      </div>

      {allAnswered && (() => {
        const rec = getRecommendation();
        return (
          <div className="start-recommendation">
            <h3>{rec.title}</h3>
            <p>{rec.body}</p>
            <button className="start-cta" onClick={() => onNavigate(rec.tab)}>{rec.cta} →</button>
          </div>
        );
      })()}
    </div>
  );
};

export default StartHere;

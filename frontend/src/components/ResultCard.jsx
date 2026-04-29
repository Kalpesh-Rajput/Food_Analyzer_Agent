import './ResultCard.css'

function ResultCard({ result }) {
  const verdictEmoji = result.score === '🟢' ? '✅' : result.score === '🟡' ? '⚠️' : '❌'
  const verdictColor = result.score === '🟢' ? 'green' : result.score === '🟡' ? 'yellow' : 'red'

  return (
    <div className="result-card">
      {/* Header with Verdict */}
      <div className={`verdict-header verdict-${verdictColor}`}>
        <div className="verdict-info">
          <span className="verdict-emoji">{result.score}</span>
          <div>
            <h3>{result.verdict}</h3>
            <p>Score: {result.health_score}/100</p>
          </div>
        </div>
      </div>

      {/* Main Message */}
      <div className="message-section">
        <p className="main-message">{result.message}</p>
      </div>

      {/* Insights */}
      {result.insights && result.insights.length > 0 && (
        <div className="insights-section">
          <h4>Key Insights</h4>
          <ul className="insights-list">
            {result.insights.slice(0, 6).map((insight, idx) => (
              <li key={idx} className="insight-item">
                <span className="insight-icon">{insight.icon}</span>
                <span className="insight-text">{insight.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Misleading Claims */}
      {result.misleading_claims && result.misleading_claims.length > 0 && (
        <div className="claims-section warning">
          <h4>🚨 Misleading Claims Detected</h4>
          <div className="claims-list">
            {result.misleading_claims.map((claim, idx) => (
              <div key={idx} className="claim-item">
                <p className="claim-title">
                  Claim: <strong>"{claim.claim}"</strong>
                </p>
                <p className="claim-reality">
                  Reality: {claim.reality}
                </p>
                <span className={`severity severity-${claim.severity}`}>{claim.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Facts */}
      {result.nutrition && (
        <div className="nutrition-section">
          <h4>Nutrition Facts</h4>
          <div className="nutrition-grid">
            {result.nutrition.energy_kcal_per_100g && (
              <div className="nutrition-item">
                <span className="label">Energy</span>
                <span className="value">{result.nutrition.energy_kcal_per_100g} kcal</span>
              </div>
            )}
            {result.nutrition.sugar_g !== null && result.nutrition.sugar_g !== undefined && (
              <div className="nutrition-item">
                <span className="label">Sugar</span>
                <span className="value">{result.nutrition.sugar_g}g</span>
              </div>
            )}
            {result.nutrition.sodium_mg && (
              <div className="nutrition-item">
                <span className="label">Sodium</span>
                <span className="value">{result.nutrition.sodium_mg}mg</span>
              </div>
            )}
            {result.nutrition.fat_g && (
              <div className="nutrition-item">
                <span className="label">Fat</span>
                <span className="value">{result.nutrition.fat_g}g</span>
              </div>
            )}
            {result.nutrition.protein_g && (
              <div className="nutrition-item">
                <span className="label">Protein</span>
                <span className="value">{result.nutrition.protein_g}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredients & Allergens */}
      {result.ingredients && (
        <div className="ingredients-section">
          {result.ingredients.ingredient_list && result.ingredients.ingredient_list.length > 0 && (
            <div className="ingredient-subsection">
              <h5>Main Ingredients ({result.ingredients.ingredient_list.length})</h5>
              <p className="ingredient-list">
                {result.ingredients.ingredient_list.slice(0, 8).join(', ')}
                {result.ingredients.ingredient_list.length > 8 && '...'}
              </p>
            </div>
          )}

          {result.ingredients.additives && result.ingredients.additives.length > 0 && (
            <div className="ingredient-subsection warning">
              <h5>⚠️ Additives ({result.ingredients.additives.length})</h5>
              <p className="ingredient-list">{result.ingredients.additives.join(', ')}</p>
            </div>
          )}

          {result.ingredients.allergens && result.ingredients.allergens.length > 0 && (
            <div className="ingredient-subsection alert">
              <h5>🚨 Allergens</h5>
              <p className="ingredient-list">{result.ingredients.allergens.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Debug Info */}
      {result.raw_ocr_text && (
        <details className="debug-section">
          <summary>Raw OCR Text (Debug)</summary>
          <pre>{result.raw_ocr_text}</pre>
        </details>
      )}
    </div>
  )
}

export default ResultCard

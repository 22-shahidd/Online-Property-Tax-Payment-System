import React from "react";

// HelpPanel is a CLASS COMPONENT (for syllabus demonstration)
// It shows the tax calculation explanation
class HelpPanel extends React.Component {
  render() {
    return (
      <div className="formula">
        <div className="formula-mark">f</div>
        <div>
          <p className="eyebrow">Calculation guide</p>
          <strong>Base tax = area x base rate x usage factor x age factor</strong>
          <span>
            Final due = base tax - rebate + penalty. Rebate is applied if paid on
            or before the due date. Penalty is added monthly if paid late, capped
            at the penalty cap.
          </span>
        </div>
      </div>
    );
  }
}

export default HelpPanel;

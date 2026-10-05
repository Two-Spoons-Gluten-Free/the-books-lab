/** The Books Lab optional receiver. Paste into a Sheet's bound Apps Script project.
 * Change SHARED_TOKEN to match config.js. This public token filters junk only.
 */
const SHARED_TOKEN = 'CHANGE_ME';
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const respond = value => ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    const data = JSON.parse(e.postData.contents);
    if (SHARED_TOKEN === 'CHANGE_ME' || data.token !== SHARED_TOKEN) return respond({ok:false});
    if (!data.eventId || !data.timestamp || !data.module || !data.exerciseId) return respond({ok:false});
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const attempts = ensureTab(book, 'Attempts', ['Timestamp','Learner','Module','Exercise ID','Correct','Score','Time spent (seconds)','Skill','Event ID']);
    const summary = ensureTab(book, 'Summary', ['Timestamp','Learner','Module','Score','Mastery','Time spent (seconds)','Event ID']);
    // An event can be retried if the browser never receives network confirmation.
    // Find it in both tabs before appending; do not rely on expiring properties.
    for (const tab of [attempts, summary]) {
      if (tab.getLastRow() > 1 && tab.getRange(2, tab.getLastColumn(), tab.getLastRow()-1, 1)
          .createTextFinder(String(data.eventId)).matchEntireCell(true).findNext()) return respond({ok:true,duplicate:true});
    }
    const safe = value => {
      const text = String(value || '').slice(0,100);
      // Treat externally supplied strings as text, never spreadsheet formulas.
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };
    const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
    const name = safe(String(data.learner || 'Learner').slice(0,30));
    if (data.type === 'summary') summary.appendRow([safe(data.timestamp),name,safe(data.module),numeric(data.score),numeric(data.mastery),numeric(data.timeSpent),safe(data.eventId)]);
    else attempts.appendRow([safe(data.timestamp),name,safe(data.module),safe(data.exerciseId),data.correct === true,numeric(data.score),numeric(data.timeSpent),safe(data.skill),safe(data.eventId)]);
    return respond({ok:true});
  } catch (error) {
    return respond({ok:false});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
function ensureTab(book, name, headings) {
  const tab = book.getSheetByName(name) || book.insertSheet(name);
  if (tab.getLastRow() === 0) {tab.appendRow(headings);tab.setFrozenRows(1);}
  return tab;
}

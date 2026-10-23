export function calICSText(events, calendar){
 const clean=value=>String(value).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(';','\\;').replaceAll(',','\\,');
 const utc=value=>value.replace(/[-:]/g,'').replace('.000','');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nasdaq Observatory//US Market Calendar//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const e of events){lines.push('BEGIN:VEVENT','UID:'+e.id+'@nasdaq-observatory','DTSTAMP:'+(e.verifiedAt||calendar.verifiedAt).replaceAll('-','')+'T000000Z');if(e.allDay){const end=new Date(e.date+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);lines.push('DTSTART;VALUE=DATE:'+e.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replaceAll('-',''))}else lines.push('DTSTART:'+utc(e.instant));lines.push('SUMMARY:'+clean(e.name),'DESCRIPTION:'+clean((e.dateOnly?'美东日期：'+e.date+' · '+e.timeLabel+'\n':'')+e.summary+'\n'+e.details+'\n'+e.impact+(e.resultSummary?'\n官方公布摘要：'+e.resultSummary+'\n原文：'+e.resultSource:'')+'\n指标说明：'+e.overviewSource+'\n日程核对：'+(e.verifiedAt||calendar.verifiedAt)+'；请以源站后续调整为准。'),'URL:'+e.source,'STATUS:'+(e.tentative?'TENTATIVE':'CONFIRMED'),'END:VEVENT')}
 lines.push('END:VCALENDAR');
 // Fold by UTF-8 bytes without splitting a multi-byte code point (RFC 5545).
 return lines.flatMap(line=>{let rows=[],row='',bytes=0;for(const character of line){const size=new TextEncoder().encode(character).length;if(bytes+size>73){rows.push(row);row=' ';bytes=1}row+=character;bytes+=size}rows.push(row);return rows}).join('\r\n')+'\r\n';
}

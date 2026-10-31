// These helpers also accept a transaction client, so booking and notices commit together.
export async function notifyBookingCreated(database, session) {
  const scheduled = new Date(session.scheduledTime).toLocaleString('en-GB',{timeZone:'UTC'});
  return database.notification.createMany({data:[
    {userId:session.seniorId,type:'session_request',title:'New Session Request',message:`A candidate requested "${session.topic}" for ${scheduled} UTC.`,data:{bookingId:session.id}},
    {userId:session.juniorId,type:'session_requested',title:'Session request sent',message:`Your session about "${session.topic}" for ${scheduled} UTC is awaiting your mentor’s response.`,data:{bookingId:session.id}}
  ]});
}
export async function notifySessionCancelled(database, session, actorId) {
  return database.notification.create({data:{userId:actorId === session.juniorId ? session.seniorId : session.juniorId,type:'session_cancelled',title:'Session cancelled',message:`Your session about "${session.topic}" was cancelled by the other participant.`,data:{bookingId:session.id}}});
}

function sendContext(context, result, status) {
  context.res = {
    headers: { 'Content-Type': 'application/json' },
    status: status,
    body: result,
  };
  context.done();
}
exports.sendContext = sendContext;

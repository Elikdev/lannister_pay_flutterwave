export const internalResponse = (
  status = true,
  data,
  statusCode = 200,
  message = "success"
) => {
  return {
    status,
    statusCode,
    message,
    data,
  }
}

export const errorResponse = (
  res,
  message = "NotOK",
  status = 400,
  data = {}
) => {
  return res.status(status).json({
    status: "NOT OK",
    message,
    response: data,
  })
}

export const successResponse = (
  res,
  message = "OK",
  status = 200,
  data = {}
) => {
  return res.status(status).json({
    ...data,
  })
}

const notImplemented = (res, feature) => {
  res.status(501).json({
    status: 'error',
    message: `${feature} todavía no está implementado`
  })
}

export const register = (req, res) => notImplemented(res, 'El registro de usuarios')

export const login = (req, res) => notImplemented(res, 'El login')

export const current = (req, res) => notImplemented(res, 'La consulta del usuario actual')

export const logout = (req, res) => notImplemented(res, 'El logout')

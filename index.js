const semaphores = new Set()

function createSemaphoreMiddleware() {
  return () => {
    return next => action => {
      const result = next(action)
      for (let semaphore of semaphores) {
        semaphore(action)
      }
      return result
    }
  }
}

function normalizePattern(pattern) {
  return typeof pattern === 'string'
    ? action => action.type === pattern
    : pattern
}

function semaphore(resolvePattern, rejectPattern) {
  const resolveOn = normalizePattern(resolvePattern)
  const rejectOn = normalizePattern(rejectPattern)
  let semaphoreInstance
  return new Promise((resolve, reject) => {
    semaphoreInstance = action => {
      if (resolveOn(action)) {
        resolve(action)
      } else if (rejectOn && rejectOn(action)) {
        reject(action)
      }
    }
    semaphores.add(semaphoreInstance)
  })
    .then(action => {
      semaphores.delete(semaphoreInstance)
      return action
    })
    .catch(error => {
      semaphores.delete(semaphoreInstance)
      return Promise.reject(error)
    })
}

module.exports = {
  createSemaphoreMiddleware,
  semaphore,
}

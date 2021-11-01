const S = require('fluent-schema')

const profileBodySchema = S.object()
  .prop('name', S.string().minLength(3).required())
  .prop('bio', S.string())
  .prop('twitter_handle', S.string().required())

exports.profileSchema = {
  tags: ['User'],
  summary: 'Login',
  body: profileBodySchema
}

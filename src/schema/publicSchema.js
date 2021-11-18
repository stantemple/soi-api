const S = require('fluent-schema')

const loginJsonSchema = S.object().prop(
  'wallet',
  S.string().minLength(10).required()
)

const archiveBodySchema = S.object().prop('endDate', S.string().required())

const archiveParamSchema = S.object().title('archive').prop('page', S.number())

const getTeamParamSchema = S.object()
  .title('Team details')
  .prop('nftId', S.string().required())

const stakeBodySchema = S.object()
  .prop('wallet', S.string().minLength(10).required())
  .prop('amount', S.number().required())
  .prop('hashTag', S.string().required())

const getStakeBodySchema = S.object()
  .prop('wallet', S.string().minLength(10).required())
  .prop('hashTag', S.string().required())

const adminJsonSchema = S.object()
  .prop('email', S.string().format(S.FORMATS.EMAIL))
  .prop('password', S.string().minLength(3).required())

const claimStakeBodySchema = S.object().prop(
  'docId',
  S.string().pattern('^[a-fA-F0-9]{24}$').required()
)

exports.adminLoginSchema = {
  tags: ['Admin'],
  summary: 'Admin login',
  body: adminJsonSchema
}

exports.loginSchema = {
  tags: ['User'],
  summary: 'Login',
  body: loginJsonSchema
}

exports.getArchiveSchema = {
  tags: ['Admin'],
  summary: 'Archive',
  params: archiveParamSchema
}

exports.archiveSchema = {
  tags: ['Admin'],
  summary: 'Archive',
  body: archiveBodySchema
}

exports.getTeamSchema = {
  tags: ['Public'],
  summary: 'Get Team Details',
  params: getTeamParamSchema
}

exports.stakeSchema = {
  tags: ['Public'],
  summary: 'Stake For the team',
  body: stakeBodySchema
}

exports.getStakeSchema = {
  tags: ['Public'],
  summary: 'Get Stake',
  body: getStakeBodySchema
}

exports.claimStakeSchema = {
  tags: ['Admmin'],
  summary: 'Claim Stake',
  body: claimStakeBodySchema
}

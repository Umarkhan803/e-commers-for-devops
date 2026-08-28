import { forwardRef } from 'react'
import MuiButton from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import { cn } from '../../lib/utils'

const VARIANT = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'contained', color: 'inherit' },
  outline: { variant: 'outlined', color: 'primary' },
  ghost: { variant: 'text', color: 'inherit' },
  subtle: { variant: 'contained', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
}

const SIZE = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

const SECONDARY_SX = {
  bgcolor: 'grey.900',
  color: 'common.white',
  '&:hover': { bgcolor: 'grey.800' },
}

const SUBTLE_SX = {
  bgcolor: 'rgba(63, 81, 181, 0.08)',
  color: 'primary.dark',
  boxShadow: 'none',
  '&:hover': { bgcolor: 'rgba(63, 81, 181, 0.16)', boxShadow: 'none' },
}

/**
 * Storefront button. Visuals come from MUI (ripple, elevation, contained /
 * outlined / text). `as={Link}` still works so existing call sites stay intact.
 */
const Button = forwardRef(function Button(
  {
    as,
    variant = 'primary',
    size = 'md',
    className,
    loading = false,
    disabled,
    fullWidth = false,
    children,
    sx,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  const isIcon = size === 'icon' || size === 'icon-sm'
  const mapped = VARIANT[variant] ?? VARIANT.primary
  const spinner = <CircularProgress color="inherit" size={16} />

  const extraSx = {
    ...(variant === 'secondary' ? SECONDARY_SX : null),
    ...(variant === 'subtle' ? SUBTLE_SX : null),
    ...sx,
  }

  if (isIcon) {
    return (
      <IconButton
        ref={ref}
        component={as && as !== 'button' ? as : undefined}
        color={mapped.color === 'inherit' ? 'default' : mapped.color}
        size={size === 'icon-sm' ? 'small' : 'medium'}
        disabled={isDisabled}
        className={className}
        aria-disabled={isDisabled || undefined}
        sx={{
          ...(variant === 'primary' && {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }),
          ...(variant === 'secondary' && SECONDARY_SX),
          ...(variant === 'outline' && {
            border: '1px solid',
            borderColor: 'primary.main',
            color: 'primary.main',
          }),
          ...sx,
        }}
        {...props}
      >
        {loading ? spinner : children}
      </IconButton>
    )
  }

  return (
    <MuiButton
      ref={ref}
      component={as && as !== 'button' ? as : undefined}
      variant={mapped.variant}
      color={mapped.color}
      size={SIZE[size] ?? 'medium'}
      fullWidth={fullWidth}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      className={cn(className)}
      startIcon={loading ? spinner : undefined}
      sx={extraSx}
      {...props}
    >
      {children}
    </MuiButton>
  )
})

export default Button

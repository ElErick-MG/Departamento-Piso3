import { NextRequest, NextResponse } from 'next/server';
import { query, Supply, User, NotificationLog } from '@/lib/db';
import { Resend } from 'resend';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/cron/notifications - Verificar suministros y enviar notificaciones
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los suministros
    const suppliesResult = await query<Supply>(
      'SELECT * FROM supplies WHERE last_purchase_date IS NOT NULL'
    );

    const notifications: any[] = [];

    for (const supply of suppliesResult.rows) {
      const daysSincePurchase = differenceInDays(new Date(), new Date(supply.last_purchase_date!));
      const daysRemaining = supply.duration_days - daysSincePurchase;

      // Obtener usuario actual del turno
      const userResult = await query<User>(
        'SELECT * FROM users WHERE id = $1',
        [supply.current_user_id]
      );

      const user = userResult.rows[0];
      if (!user) continue;

      // Verificar si debe enviar notificación
      const shouldNotify = daysRemaining <= user.notification_days_before && daysRemaining >= 0;

      if (shouldNotify) {
        // Verificar si ya se envió notificación hoy
        const today = format(new Date(), 'yyyy-MM-dd');
        const logResult = await query<NotificationLog>(
          `SELECT * FROM notifications_log 
           WHERE supply_id = $1 
           AND user_id = $2 
           AND DATE(sent_at) = $3
           AND notification_type = 'reminder'`,
          [supply.id, user.id, today]
        );

        if (logResult.rows.length === 0) {
          // Enviar email
          try {
            const expiresAt = new Date(
              new Date(supply.last_purchase_date!).getTime() + supply.duration_days * 24 * 60 * 60 * 1000
            );

            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
              to: user.email,
              subject: `🔔 Recordatorio: Es tu turno para comprar ${supply.name}`,
              html: `
                <h2>Hola ${user.name},</h2>
                <p>Este es un recordatorio de que es tu turno para comprar <strong>${supply.name}</strong>.</p>
                <p><strong>Días restantes:</strong> ${daysRemaining} día(s)</p>
                <p><strong>Fecha de vencimiento:</strong> ${format(expiresAt, "d 'de' MMMM", { locale: es })}</p>
                <p>Por favor, completa tu compra y márcala en la app para que el siguiente roommate pueda tomar su turno.</p>
                <br>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a></p>
                <br>
                <p style="color: #666; font-size: 12px;">Departamento Piso 3 - Sistema de Gestión de Tareas</p>
              `,
            });

            // Registrar notificación exitosa
            await query(
              `INSERT INTO notifications_log (supply_id, user_id, notification_type, email_sent)
               VALUES ($1, $2, 'reminder', TRUE)`,
              [supply.id, user.id]
            );

            notifications.push({
              supply: supply.name,
              user: user.name,
              daysRemaining,
              status: 'sent',
            });
          } catch (emailError: any) {
            console.error('Error sending email:', emailError);

            // Registrar error
            await query(
              `INSERT INTO notifications_log (supply_id, user_id, notification_type, email_sent, email_error)
               VALUES ($1, $2, 'reminder', FALSE, $3)`,
              [supply.id, user.id, emailError.message]
            );

            notifications.push({
              supply: supply.name,
              user: user.name,
              daysRemaining,
              status: 'error',
              error: emailError.message,
            });
          }
        }
      }

      // Notificación de vencimiento (día que expira)
      if (daysRemaining === 0) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const logResult = await query<NotificationLog>(
          `SELECT * FROM notifications_log 
           WHERE supply_id = $1 
           AND user_id = $2 
           AND DATE(sent_at) = $3
           AND notification_type = 'overdue'`,
          [supply.id, user.id, today]
        );

        if (logResult.rows.length === 0) {
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
              to: user.email,
              subject: `⚠️ URGENTE: ${supply.name} se agota HOY`,
              html: `
                <h2 style="color: #dc2626;">¡Atención ${user.name}!</h2>
                <p>El <strong>${supply.name}</strong> se agota <strong>HOY</strong>.</p>
                <p>Por favor, completa la compra lo antes posible y márcala en la app.</p>
                <br>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a></p>
                <br>
                <p style="color: #666; font-size: 12px;">Departamento Piso 3 - Sistema de Gestión de Tareas</p>
              `,
            });

            await query(
              `INSERT INTO notifications_log (supply_id, user_id, notification_type, email_sent)
               VALUES ($1, $2, 'overdue', TRUE)`,
              [supply.id, user.id]
            );

            notifications.push({
              supply: supply.name,
              user: user.name,
              type: 'overdue',
              status: 'sent',
            });
          } catch (emailError: any) {
            console.error('Error sending overdue email:', emailError);
            await query(
              `INSERT INTO notifications_log (supply_id, user_id, notification_type, email_sent, email_error)
               VALUES ($1, $2, 'overdue', FALSE, $3)`,
              [supply.id, user.id, emailError.message]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron ejecutado exitosamente. Notificaciones enviadas: ${notifications.length}`,
      notifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Error en cron job', details: String(error) },
      { status: 500 }
    );
  }
}

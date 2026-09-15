namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface IReturnService
    {
        // راجع من زبون → يزيد المخزون (kind=return).
        void RecordReturn(string productId, string saleId, double qty, string reason, ActorContext actor);
        // تالف → ينقص المخزون (kind=damage).
        void RecordDamage(string productId, double qty, string reason, ActorContext actor);
    }
}

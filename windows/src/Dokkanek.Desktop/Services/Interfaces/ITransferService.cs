namespace Dokkanek.Desktop.Services.Interfaces
{
    public interface ITransferService
    {
        // تحويل بين مخزنين — يرجع المرجع TRF-xxx.
        string Transfer(string productId, string fromId, string toId, double qty, ActorContext actor);
    }
}
